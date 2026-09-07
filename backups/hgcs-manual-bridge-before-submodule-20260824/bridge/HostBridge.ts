/**
 * HostBridge - Cocos 与宿主页面的 postMessage 通讯桥接
 *
 * 用于 Web 环境下，Cocos 游戏（iframe）与 Vue Host 宿主页面之间的通讯
 * 此文件位于游戏专案的 bridge/ 目录，可在 ExternalModules 载入前初始化
 *
 * 通讯协议：
 * - type: 'GAME_HOST' (固定标识)
 * - action: 消息动作类型
 * - payload: 消息数据
 *
 * 消息流向：
 * - OPEN_MODAL:   Cocos -> Host  (请求打开弹窗)
 * - MODAL_OPENED: Host -> Cocos  (弹窗已打开确认)
 * - MODAL_CLOSED: Host -> Cocos  (弹窗已关闭确认)
 * - SET_TOKEN:    Host -> Cocos  (下发 token 和语系)
 * - REQUEST_TOKEN: Cocos -> Host (请求 token)
 * - SET_LANGUAGE: Host -> Cocos  (下发语言设置)
 * - REQUEST_LANGUAGE: Cocos -> Host (请求语言设置)
 * - SET_CONFIG:    Host -> Cocos  (下发环境 URL 配置：apiBaseUrl / externalModulesBaseDomain)
 * - REQUEST_CONFIG: Cocos -> Host (请求环境 URL 配置)
 * - AUTH_INVALID: Cocos -> Host  (token 失效)
 * - GAME_READY:   Cocos -> Host  (游戏资源载入完成)
 */

import { ServiceBridge } from "./ServiceBridge";
import { resConfig } from "../config/ResConfig";
import type { ILogger } from "./types/core";

/**
 * 用户资讯（从 Host 接收）
 */
export interface UserInfo {
    operatorId: string;
    userId: string;
    balance: number;
}

/**
 * 环境 URL 配置（从 Host 接收）
 * 注：externalModulesBaseDomain 约定为 bare domain（不含 /ext-module），由遊戲端组 URL 时补上
 */
export interface HostConfig {
    apiBaseUrl?: string;
    externalModulesBaseDomain?: string;
    env?: string;
}

/**
 * Modal 回调参数
 */
export interface ModalPayload {
    modalId: string;
    modalKey: string;
}

/**
 * Token 回调函数
 */
export type TokenCallback = (token: string) => void;

/**
 * Modal 回调函数
 */
export type ModalCallback = (payload: ModalPayload) => void;

type HostMessageAction =
    | "OPEN_MODAL"
    | "MODAL_OPENED"
    | "MODAL_CLOSED"
    // Token 相关协议
    | "SET_TOKEN" // Host → Cocos：下发 token
    | "REQUEST_TOKEN" // Cocos → Host：请求 token
    | "SET_LANGUAGE" // Host → Cocos：下发语言设置
    | "REQUEST_LANGUAGE" // Cocos → Host：请求语言设置
    | "SET_CONFIG" // Host → Cocos：下发环境 URL 配置
    | "REQUEST_CONFIG" // Cocos → Host：请求环境 URL 配置
    | "AUTH_INVALID" // Cocos → Host：token 失效（如 401）
    // 游戏状态协议
    | "GAME_READY" // Cocos → Host：游戏资源载入完成
    | "EXIT_GAME" // Cocos → Host：游戏请求退出
    | "SPIN" // Host → Cocos：触发 Spin 操作
    // 消息队列协议
    | "ACK"; // Cocos → Host：消息回执

interface HostMessage {
    type: "GAME_HOST";
    action: HostMessageAction;
    payload: Record<string, unknown>;
    // 队列相关字段（可选，向后兼容）
    msgId?: string;
    channel?: "game" | "popup";
    ts?: number;
    requiresAck?: boolean;
}

/**
 * HostBridge 单例类
 *
 * 特点：
 * - 不依赖 ExternalModules，可以在 Cocos 载入后立即初始化
 * - 使用 ServiceBridge.getLogger() 的 Proxy 机制（初始化前自动使用 console）
 *
 * 使用方式：
 * ```typescript
 * // Bootstrap.onLoad() 最开始
 * HostBridge.getInstance().initialize();
 *
 * // 等待 token 并取得语系
 * await HostBridge.getInstance().waitForToken();
 * const lang = HostBridge.getInstance().getLanguage();
 *
 * // 在 ServiceBridge 初始化时绑定到 DI 容器
 * ServiceBridge.addCustomConfigure(() => {
 *   const { container, SERVICE_IDENTIFIERS } = window.ExternalModules;
 *   container.bind(SERVICE_IDENTIFIERS.HOST_BRIDGE)
 *     .toConstantValue(HostBridge.getInstance());
 * });
 * ```
 */
export class HostBridge {
    private static readonly HOST_PRESENTATION_STYLE_ID = "game-host-presentation-overrides";

    private static instance: HostBridge | null = null;

    private initialized = false;
    private hostOrigin: string | null = null;
    private modalOpenedCallbacks: ModalCallback[] = [];
    private modalClosedCallbacks: ModalCallback[] = [];
    private tokenCallbacks: TokenCallback[] = [];
    private spinCallbacks: (() => void)[] = [];

    // Token 状态
    private token: string | null = null;
    private userInfo: UserInfo | null = null;
    private language: string = "en";
    private languageReady = false;
    private languageReadyPromise: Promise<string> | null = null;
    private languageReadyResolve: ((lang: string) => void) | null = null;
    private tokenReady = false;
    private tokenReadyPromise: Promise<string> | null = null;
    private tokenReadyResolve: ((token: string) => void) | null = null;
    // 环境 URL 配置状态（Host 下发；externalModulesBaseDomain 为 bare domain）
    private hostConfig: HostConfig | null = null;
    private configReady = false;
    private configReadyPromise: Promise<HostConfig | null> | null = null;
    private configReadyResolve: ((config: HostConfig | null) => void) | null = null;

    private boundHandleMessage = this.handleMessage.bind(this);

    // 使用 ServiceBridge.getLogger() 的 Proxy（初始化前自动使用 console）
    private logger: ILogger;

    // 消息状态缓存（幂等去重）
    private msgStatusMap = new Map<string, "processing" | "ok" | "error">();
    private msgOrder: string[] = [];
    private readonly MSG_ID_CACHE_SIZE = 100;

    private constructor() {
        this.logger = ServiceBridge.getLogger();
    }

    /**
     * 获取 HostBridge 单例
     */
    static getInstance(): HostBridge {
        if (!HostBridge.instance) {
            HostBridge.instance = new HostBridge();
        }
        return HostBridge.instance;
    }

    /**
     * 初始化 HostBridge
     * 注册 message 事件监听
     */
    initialize(hostOrigin?: string): void {
        if (this.initialized) {
            this.logger.warn("[HostBridge] 已初始化，跳过重复初始化");
            return;
        }
        this.hostOrigin = this.normalizeOrigin(hostOrigin) ?? this.resolveParentOrigin();
        window.addEventListener("message", this.boundHandleMessage);
        this.initialized = true;
        if (this.isInIframe() && !this.hostOrigin) {
            this.logger.error("[HostBridge] 无法确认宿主来源，将拒绝所有宿主消息");
        }
        this.logger.info("[HostBridge] 初始化完成");
    }

    /**
     * 游戏自己已经绘制完整的竖屏背景，宿主不应再在画布两侧铺设背景图。
     * DEV/STG 的 Host 与游戏 iframe 同源，可在 Host 重绘后仍通过样式规则保持隐藏。
     */
    hideHostBackground(): void {
        if (!this.isInIframe()) return;

        try {
            const hostDocument = window.parent.document;
            if (hostDocument.getElementById(HostBridge.HOST_PRESENTATION_STYLE_ID)) return;

            const style = hostDocument.createElement("style");
            style.id = HostBridge.HOST_PRESENTATION_STYLE_ID;
            style.textContent = `
                .host-bg {
                    display: none !important;
                    background-image: none !important;
                }
            `;
            hostDocument.head.appendChild(style);
            this.logger.info("[HostBridge] 已隐藏宿主背景");
        } catch (error) {
            this.logger.warn("[HostBridge] 宿主非同源，无法隐藏宿主背景", error);
        }
    }

    /**
     * 销毁 HostBridge
     */
    destroy(): void {
        if (this.isInIframe()) {
            try {
                window.parent.document.getElementById(HostBridge.HOST_PRESENTATION_STYLE_ID)?.remove();
            } catch {
                // 非同源宿主无法访问，初始化时也不会写入覆盖样式。
            }
        }
        window.removeEventListener("message", this.boundHandleMessage);
        this.initialized = false;
        this.hostOrigin = null;
        // 清理消息状态缓存
        this.msgStatusMap.clear();
        this.msgOrder = [];
        this.logger.info("[HostBridge] 已销毁");
    }

    /**
     * 检查是否在 iframe 中运行
     */
    private isInIframe(): boolean {
        try {
            return window.self !== window.top;
        } catch {
            return true;
        }
    }

    private normalizeOrigin(value?: string): string | null {
        if (!value) return null;
        try {
            const origin = new URL(value).origin;
            return origin === "null" ? null : origin;
        } catch {
            return null;
        }
    }

    private resolveParentOrigin(): string | null {
        const ancestorOrigin = window.location.ancestorOrigins?.item(0);
        return this.normalizeOrigin(ancestorOrigin ?? undefined) ?? this.normalizeOrigin(document.referrer);
    }

    /**
     * 设置消息状态（幂等去重）
     */
    private setMsgStatus(msgId: string, status: "processing" | "ok" | "error"): void {
        if (!msgId) return;

        // 首次出现则记录顺序
        if (!this.msgStatusMap.has(msgId)) {
            this.msgOrder.push(msgId);
        }

        this.msgStatusMap.set(msgId, status);

        // 超出限制时清理最早的
        if (this.msgOrder.length > this.MSG_ID_CACHE_SIZE) {
            const oldest = this.msgOrder.shift();
            if (oldest) this.msgStatusMap.delete(oldest);
        }
    }

    /**
     * 发送 ACK 回执到 Host
     */
    private sendAck(msgId: string, channel: "game" | "popup", status: "ok" | "error", error?: string): void {
        if (!this.isInIframe()) return;

        const ackMessage = {
            type: "GAME_HOST" as const,
            action: "ACK" as const,
            payload: {
                msgId,
                channel,
                status,
                error,
            },
            ts: Date.now(),
        };

        try {
            if (!this.hostOrigin) return;
            window.parent.postMessage(ackMessage, this.hostOrigin);
            this.logger.debug(`[HostBridge] 发送 ACK: ${msgId} ${status}`);
        } catch (err) {
            this.logger.error(`[HostBridge] 发送 ACK 失败: ${msgId}`, err);
        }
    }

    /**
     * 处理来自宿主页面的消息
     */
    private handleMessage(event: MessageEvent): void {
        if (event.source !== window.parent) return;
        if (!this.hostOrigin || event.origin !== this.hostOrigin) {
            this.logger.warn(`[HostBridge] 已拒绝非信任来源消息: ${event.origin || "unknown"}`);
            return;
        }
        const data = event.data as HostMessage;

        // 验证消息格式
        if (!data || data.type !== "GAME_HOST") {
            return;
        }

        const { action, payload, msgId, channel, requiresAck } = data;

        // ACK 消息由 Host 处理，游戏端直接忽略
        if (action === "ACK") return;

        const ackChannel = "game" as const;
        if (channel && channel !== "game") {
            this.logger.warn(`[HostBridge] 收到非 game 通道消息：${channel}，仍回 ACK 到 'game'`);
        }

        // 幂等检查：根据状态决定是否重复处理
        const status = msgId ? this.msgStatusMap.get(msgId) : undefined;
        if (status === "processing") {
            this.logger.warn(`[HostBridge] 重复消息(processing 中，忽略): ${action} msgId=${msgId}`);
            return;
        }
        if (status === "ok") {
            this.logger.warn(`[HostBridge] 重复消息(已处理成功，重发 ACK): ${action} msgId=${msgId}`);
            if (requiresAck !== false && msgId) {
                this.sendAck(msgId, ackChannel, "ok");
            }
            return;
        }
        if (status === "error") {
            this.logger.warn(`[HostBridge] 重复消息(已处理失败，重发 error ACK): ${action} msgId=${msgId}`);
            if (requiresAck !== false && msgId) {
                this.sendAck(msgId, ackChannel, "error");
            }
            return;
        }

        // 标记为处理中
        if (msgId && requiresAck !== false) {
            this.setMsgStatus(msgId, "processing");
        }

        this.logger.info(`[HostBridge] 收到消息: ${action}${msgId ? ` msgId=${msgId}` : ""}`);

        try {
            switch (action) {
                case "MODAL_OPENED":
                    this.notifyModalOpened(payload as unknown as ModalPayload);
                    break;
                case "MODAL_CLOSED":
                    this.notifyModalClosed(payload as unknown as ModalPayload);
                    break;
                case "SET_TOKEN":
                    this.handleSetToken(payload as unknown as { token: string; userInfo?: UserInfo; l?: string });
                    break;
                case "SET_LANGUAGE":
                    this.handleSetLanguage(payload as unknown as { l?: string });
                    break;
                case "SET_CONFIG":
                    this.handleSetConfig(payload as unknown as { apiBaseUrl?: string; externalModulesBaseDomain?: string; env?: string });
                    break;
                case "SPIN":
                    this.notifySpin();
                    break;
            }

            // 处理成功
            if (msgId) {
                this.setMsgStatus(msgId, "ok");
                if (requiresAck !== false) {
                    this.sendAck(msgId, ackChannel, "ok");
                }
            }
        } catch (err) {
            // 处理失败
            if (msgId) {
                this.setMsgStatus(msgId, "error");
                if (requiresAck !== false) {
                    this.sendAck(msgId, ackChannel, "error", String(err));
                }
            }
            this.logger.error(`[HostBridge] 处理消息失败: ${action}`, err);
        }
    }

    /**
     * 处理 Host 下发的语言设置
     */
    private handleSetLanguage(payload: { l?: string }): void {
        const { l } = payload;
        // 存储语言（仅接受 en 或 zh，默认 en）
        this.language = resConfig.normalizeLanguage(l || "");
        this.languageReady = true;
        // 解析等待中的 Promise
        if (this.languageReadyResolve) {
            this.languageReadyResolve(this.language);
            this.languageReadyResolve = null;
        }
        this.logger.info("[HostBridge] 语言已设置", { language: this.language });
    }

    /**
     * 处理 Host 下发的环境 URL 配置
     * externalModulesBaseDomain 约定为 bare domain（不含 /ext-module），由遊戲端组 URL 时补上
     */
    private handleSetConfig(payload: { apiBaseUrl?: string; externalModulesBaseDomain?: string; env?: string }): void {
        const { apiBaseUrl, externalModulesBaseDomain, env } = payload;
        const config: HostConfig = {};
        if (typeof apiBaseUrl === "string" && apiBaseUrl) {
            config.apiBaseUrl = apiBaseUrl;
        }
        if (typeof externalModulesBaseDomain === "string" && externalModulesBaseDomain) {
            config.externalModulesBaseDomain = externalModulesBaseDomain;
        }
        if (typeof env === "string" && env) {
            config.env = env;
        }
        this.hostConfig = config;
        this.configReady = true;
        // 解析等待中的 Promise（wrapper 内会 clearTimeout）
        if (this.configReadyResolve) {
            this.configReadyResolve(this.hostConfig);
            this.configReadyResolve = null;
        }
        this.logger.info("[HostBridge] 环境配置已设置", this.hostConfig);
    }

    /**
     * 处理 Host 下发的 token 和用户资讯
     */
    private handleSetToken(payload: { token: string; userInfo?: UserInfo; l?: string }): void {
        const { token, userInfo, l } = payload;
        if (!token) {
            this.logger.warn("[HostBridge] 收到空 token");
            return;
        }

        this.token = token;
        this.userInfo = userInfo || null;
        // 存储语言（仅接受 en 或 zh，默认 en）
        this.language = resConfig.normalizeLanguage(l || "");
        if (!this.languageReady) {
            this.languageReady = true;
            if (this.languageReadyResolve) {
                this.languageReadyResolve(this.language);
                this.languageReadyResolve = null;
            }
        }
        this.tokenReady = true;
        // 解析等待中的 Promise
        if (this.tokenReadyResolve) {
            this.tokenReadyResolve(token);
            this.tokenReadyResolve = null;
        }

        // 通知回调
        this.tokenCallbacks.forEach((cb) => cb(token));
        this.logger.info("[HostBridge] Token 已设置", { language: this.language });
    }

    /**
     * 发送消息到宿主页面
     * @returns 是否成功发送
     */
    private postToHost(action: HostMessageAction, payload: Record<string, unknown>): boolean {
        if (!this.isInIframe()) {
            this.logger.warn("[HostBridge] 不在 iframe 中，无法发送消息");
            return false;
        }

        const message: HostMessage = {
            type: "GAME_HOST",
            action,
            payload,
        };

        try {
            // 发送到父窗口（宿主页面）
            if (!this.hostOrigin) {
                this.logger.error("[HostBridge] 无法确认宿主来源，消息未发送");
                return false;
            }
            window.parent.postMessage(message, this.hostOrigin);
            this.logger.info(`[HostBridge] 发送消息: ${action}`);
            return true;
        } catch (error) {
            this.logger.error(`[HostBridge] 发送消息失败: ${action}`, error);
            return false;
        }
    }

    // ==================== 公开 API ====================

    /**
     * 请求打开弹窗
     * @param modalKey 弹窗类型：
     *   - 'paytable' - 赔付表
     *   - 'rules' - 游戏规则
     *   - 'history' - 历史记录
     *   - 'balance' - 钱包余额
     * @returns 是否成功发送请求（不在 iframe 中时返回 false）
     */
    openModal(modalKey: string): boolean {
        return this.postToHost("OPEN_MODAL", { modalKey });
    }

    /**
     * 注册弹窗打开回调
     */
    onModalOpened(callback: ModalCallback): void {
        this.modalOpenedCallbacks.push(callback);
    }

    /**
     * 注册弹窗关闭回调
     */
    onModalClosed(callback: ModalCallback): void {
        this.modalClosedCallbacks.push(callback);
    }

    /**
     * 移除弹窗打开回调
     */
    offModalOpened(callback: ModalCallback): void {
        const index = this.modalOpenedCallbacks.indexOf(callback);
        if (index > -1) {
            this.modalOpenedCallbacks.splice(index, 1);
        }
    }

    /**
     * 移除弹窗关闭回调
     */
    offModalClosed(callback: ModalCallback): void {
        const index = this.modalClosedCallbacks.indexOf(callback);
        if (index > -1) {
            this.modalClosedCallbacks.splice(index, 1);
        }
    }

    /**
     * 通知弹窗已打开
     */
    private notifyModalOpened(payload: ModalPayload): void {
        this.modalOpenedCallbacks.forEach((cb) => cb(payload));
    }

    /**
     * 通知弹窗已关闭
     */
    private notifyModalClosed(payload: ModalPayload): void {
        this.modalClosedCallbacks.forEach((cb) => cb(payload));
    }
    // ==================== 语言设置 相关 API ====================

    /**
     * 向 Host 请求语言设置
     * 主动发送 REQUEST_LANGUAGE，Host 会响应 SET_LANGUAGE
     */
    requestLanguage(): void {
        this.postToHost("REQUEST_LANGUAGE", {});
    }

    /**
     * 等待语言设置就绪
     * @returns Promise<string> 返回语言代码
     */
    waitForLanguage(timeoutMs: number = 5000): Promise<string> {
        // 如果已有语言设置，立即返回
        if (this.languageReady) {
            return Promise.resolve(this.language);
        }

        // 如果已有等待中的 Promise，返回它
        if (this.languageReadyPromise) {
            return this.languageReadyPromise;
        }

        // 创建新的 Promise
        this.languageReadyPromise = new Promise<string>((resolve) => {
            let settled = false;
            const timer = window.setTimeout(() => {
                if (settled) return;
                settled = true;
                this.languageReady = true;
                this.languageReadyResolve = null;
                this.logger.warn(`[HostBridge] 等待语言设置逾时（${timeoutMs}ms），使用默认语言 ${this.language}`);
                resolve(this.language);
            }, timeoutMs);

            this.languageReadyResolve = (language: string) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(language);
            };
        });

        // 主动请求语言设置
        this.requestLanguage();

        return this.languageReadyPromise;
    }

    // ==================== 环境配置 相关 API ====================

    /**
     * 向 Host 请求环境 URL 配置
     * 主动发送 REQUEST_CONFIG，Host 会响应 SET_CONFIG
     */
    requestConfig(): void {
        this.postToHost("REQUEST_CONFIG", {});
    }

    /**
     * 获取当前环境配置（同步）
     * @returns HostConfig 或 null（如果尚未收到）
     */
    getHostConfig(): HostConfig | null {
        return this.hostConfig;
    }

    /**
     * 等待 Host 下发环境 URL 配置，带 timeout
     * - 收到 SET_CONFIG：resolve 配置对象
     * - 逾时（默认 3 秒）：resolve null，呼叫方改用本地 GameConfig.ts baked 值
     * - 不在 iframe 中：无 Host 可请求，直接 resolve null
     * @param timeoutMs 逾时毫秒数，默认 3000
     */
    waitForConfig(timeoutMs: number = 3000): Promise<HostConfig | null> {
        // 已收到则立即返回
        if (this.configReady) {
            return Promise.resolve(this.hostConfig);
        }

        // 已有等待中的 Promise，返回它
        if (this.configReadyPromise) {
            return this.configReadyPromise;
        }

        // 不在 iframe 中：没有 Host 可请求，直接走本地
        if (!this.isInIframe()) {
            return Promise.resolve(null);
        }

        // 创建带 timeout 的 Promise
        this.configReadyPromise = new Promise<HostConfig | null>((resolve) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                this.configReadyResolve = null;
                this.logger.warn(`[HostBridge] 等待 SET_CONFIG 逾时（${timeoutMs}ms），改用本地配置`);
                resolve(null);
            }, timeoutMs);

            // handleSetConfig 会呼叫此 resolve（收到 SET_CONFIG），此处一并 clearTimeout
            this.configReadyResolve = (config: HostConfig | null) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(config);
            };
        });

        // 主动请求配置
        this.requestConfig();

        return this.configReadyPromise;
    }

    // ==================== Token 相关 API ====================

    /**
     * 向 Host 请求 token
     * 主动发送 REQUEST_TOKEN，Host 会响应 SET_TOKEN
     */
    requestToken(): void {
        this.postToHost("REQUEST_TOKEN", {});
    }

    /**
     * 获取当前 token（同步）
     * @returns token 或 null（如果尚未收到）
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * 获取当前用户资讯（同步）
     * @returns userInfo 或 null（如果尚未收到）
     */
    getUserInfo(): UserInfo | null {
        return this.userInfo;
    }

    /**
     * 获取当前语言（同步）
     *
     * 优先顺序：
     * 1. iframe 模式下 Host 已下发的 LanguageSetting（this.languageReady = true）
     * 2. 非 iframe 模式 fallback：从 URL 参数 `?l=` 或 `?lang=` 抓取（首次抓到即 cache）
     * 3. 都没有 → 预设 'en'
     *
     * @returns 语言代码（'en' 或 'zh'，默认 'en'）
     */
    getLanguage(): string {
        if (!this.languageReady) {
            const urlLang = this.detectLanguageFromUrl();
            if (urlLang) {
                this.language = urlLang;
                this.languageReady = true;
            }
        }
        return this.language;
    }

    /**
     * 非 iframe 环境 fallback：从 URL 参数读取语系（支援 `l=` 或 `lang=` 两种格式）
     * 只接受 'en' 或 'zh'，其他值或读取失败回 null（由呼叫端走预设）
     */
    private detectLanguageFromUrl(): string | null {
        if (typeof window === "undefined" || !window.location) return null;
        try {
            const params = new URLSearchParams(window.location.search);
            const raw = params.get("l") || params.get("lang");
            if (raw) return resConfig.normalizeLanguage(raw);
        } catch {
            // 解析失败（极少数环境无 URLSearchParams）忽略
        }
        return null;
    }

    /**
     * 检查 token 是否就绪
     */
    isTokenReady(): boolean {
        return this.tokenReady;
    }

    /**
     * 等待 token 就绪
     * @returns Promise<string> 返回 token
     */
    waitForToken(timeoutMs: number = 10000): Promise<string> {
        // 如果已有 token，立即返回
        if (this.token) {
            return Promise.resolve(this.token);
        }

        // 如果已有等待中的 Promise，返回它
        if (this.tokenReadyPromise) {
            return this.tokenReadyPromise;
        }

        // 创建新的 Promise
        this.tokenReadyPromise = new Promise<string>((resolve, reject) => {
            let settled = false;
            const timer = window.setTimeout(() => {
                if (settled) return;
                settled = true;
                this.tokenReadyResolve = null;
                this.tokenReadyPromise = null;
                reject(new Error(`等待宿主授权逾时（${timeoutMs}ms）`));
            }, timeoutMs);

            this.tokenReadyResolve = (token: string) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(token);
            };
        });

        // 主动请求 token
        this.requestToken();

        return this.tokenReadyPromise;
    }

    /**
     * 注册 token 接收回调
     */
    onTokenReceived(callback: TokenCallback): void {
        this.tokenCallbacks.push(callback);
        // 如果已有 token，立即回调
        if (this.token) {
            callback(this.token);
        }
    }

    /**
     * 移除 token 接收回调
     */
    offTokenReceived(callback: TokenCallback): void {
        const index = this.tokenCallbacks.indexOf(callback);
        if (index > -1) {
            this.tokenCallbacks.splice(index, 1);
        }
    }

    /**
     * 通知 Host token 失效（如收到 401）
     * Host 会清除 session 并显示提示页面
     */
    reportAuthInvalid(status: number = 401): void {
        this.postToHost("AUTH_INVALID", { status });
        // 清除本地 token 和用户资讯
        this.token = null;
        this.userInfo = null;
        this.tokenReady = false;
        this.logger.info("[HostBridge] 已报告 Auth 失效");
    }

    /**
     * 通知 Host 游戏资源已载入完成
     * Host 会关闭载入页面
     */
    notifyGameReady(): void {
        this.postToHost("GAME_READY", {});
        this.logger.info("[HostBridge] 已通知 Host 游戏就绪");
    }

    /**
     * 通知 Host 游戏请求退出
     * Host 会隐藏游戏 iframe 并显示退出页面
     */
    exitGame(): void {
        this.postToHost("EXIT_GAME", {});
        this.logger.info("[HostBridge] 已通知 Host 游戏退出");
    }

    // ==================== Spin 相关 API ====================

    /**
     * 注册 Spin 操作回调（Host 通过空格键触发）
     */
    onSpin(callback: () => void): void {
        this.spinCallbacks.push(callback);
    }

    /**
     * 移除 Spin 操作回调
     */
    offSpin(callback: () => void): void {
        const index = this.spinCallbacks.indexOf(callback);
        if (index > -1) {
            this.spinCallbacks.splice(index, 1);
        }
    }

    /**
     * 通知所有 Spin 回调
     */
    private notifySpin(): void {
        this.spinCallbacks.forEach((cb) => cb());
    }
}

/**
 * 便捷方法：获取 HostBridge 实例
 */
export function getHostBridge(): HostBridge {
    return HostBridge.getInstance();
}
