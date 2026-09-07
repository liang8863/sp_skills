/**
 * ServiceBridge - 服务访问桥接器
 *
 * 提供统一的静态方法来访问 ExternalModules 的所有服务
 * 使用静态类设计，方便在任何地方快速访问服务
 *
 * 架构设计：
 * - ExternalModules: 提供 Container + 默认服务实现
 * - ServiceBridge: 配置层 + 统一 API
 * - 游戏: 使用 ServiceBridge.xxx 访问服务
 *
 * 使用方式：
 * ```typescript
 * // 1. 基本初始化（使用默认服务）
 * ServiceBridge.initialize();
 *
 * // 2. 自定义服务（可选）
 * ServiceBridge.setCustomConfigure(() => {
 *   const { container, SERVICE_IDENTIFIERS, AlphaToastManager } = window.ExternalModules;
 *   container.rebind(SERVICE_IDENTIFIERS.TOAST_MANAGER).to(AlphaToastManager).inSingletonScope();
 * });
 * ServiceBridge.initialize();
 *
 * // 3. 使用服务
 * const logger = ServiceBridge.getLogger();
 * ServiceBridge.toast.success('操作成功');
 * ServiceBridge.on('event:name', callback);
 * ```
 */

import type { ILogger, IEventSystem, INetworkService, IObjectPool, IRequestConfig, IResponse, IGameStateManager, IGameActionService } from "./types/core";

import type { IToastManager, IDialogManager, ILoadingManager, IToastOptions, ILoadingOptions, ILoadingConfig, DialogOptions } from "./types/uiCocos";

import type {
    ISettingsManager,
    IAudioManager,
    IAnalytics,
    IPlayerDataManager,
    IPlayerData,
    ISoundHandle,
    IMaxMultiCapService,
    IBundleManager,
    IBundleConfig,
    IBundle,
} from "./types/services";

import type { IGameConfig } from "./types/bridge";

import { getService } from "./types/core";

import type { IUtils } from "./types/utils";

import { GameConfig } from "../config/GameConfig";
import { GameApi } from "../api/GameApi";
import { GameService } from "../services/GameService";
import type { GAME_STATES_TYPE } from "./types/core";
import type { GAME_STATE_EVENTS_TYPE, PLAYER_DATA_EVENTS_TYPE } from "./types/events";
import * as i18n from "./components/i18n/LanguageData";

/**
 * ServiceBridge 静态类
 */
export class ServiceBridge {
    private static getService: typeof getService | null = null;
    private static SERVICE_IDENTIFIERS: Record<string, symbol> | null = null;
    private static isInitialized = false;
    private static GameApi: GameApi | null = null;
    private static gameService: GameService | null = null;

    /**
     * Logger Proxy（Lazy Singleton）
     * 用于在 ServiceBridge 初始化前后自动切换 Logger 实现
     */
    private static loggerProxy: ILogger | null = null;

    /**
     * 自定义配置函数列表（可选）
     * 用于 rebind 服务，替换默认实现
     * 支持多个配置函数，会按顺序执行
     */
    private static customConfigures: (() => void)[] = [];

    /** 是否在 loading.hide(default) 时自动切到 STANDBY（预设 true，可由 deferGameReady 关掉） */
    private static _autoMarkReady: boolean = true;

    /**
     * 添加自定义配置函数（可选）
     * 用于替换默认服务实现
     * 支持多次调用，会累积多个配置函数
     *
     * @example
     * ```typescript
     * ServiceBridge.addCustomConfigure(() => {
     *   const { container, SERVICE_IDENTIFIERS, PrefabBasedToastManager } = window.ExternalModules;
     *   container.bind(SERVICE_IDENTIFIERS.TOAST_MANAGER).toConstantValue(toastManager);
     * });
     *
     * ServiceBridge.addCustomConfigure(() => {
     *   const { container, SERVICE_IDENTIFIERS, PrefabBasedDialogManager } = window.ExternalModules;
     *   container.bind(SERVICE_IDENTIFIERS.DIALOG_MANAGER).toConstantValue(dialogManager);
     * });
     * ```
     */
    static addCustomConfigure(configureFn: () => void): void {
        this.customConfigures.push(configureFn);
    }

    /**
     * 设置自定义配置函数（可选，向后兼容）
     * 用于替换默认服务实现
     * 注意：此方法会覆盖之前的所有配置，建议使用 addCustomConfigure
     *
     * @deprecated 建议使用 addCustomConfigure 来累积多个配置
     */
    static setCustomConfigure(configureFn: () => void): void {
        this.customConfigures = [configureFn];
    }

    /**
     * 初始化 ServiceBridge
     *
     * 步骤：
     * 1. 从 window.ExternalModules 获取 container 和 SERVICE_IDENTIFIERS
     * 2. 执行自定义配置（如果有）- 可以 rebind 服务
     * 3. 初始化需要初始化的服务（Settings, I18n, Analytics）
     */
    static initialize(): void {
        if (this.isInitialized) {
            console.warn("[ServiceBridge] 已经初始化过，跳过重复初始化");
            return;
        }

        // Step 1: 从 window.ExternalModules 获取 container 和 SERVICE_IDENTIFIERS
        if (!window.ExternalModules) {
            throw new Error("[ServiceBridge] window.ExternalModules 未载入，请先载入 ExternalModules");
        }

        this.getService = window.ExternalModules.getService;
        this.SERVICE_IDENTIFIERS = window.ExternalModules.SERVICE_IDENTIFIERS;

        this.log("[ServiceBridge] 获取 Container 和 SERVICE_IDENTIFIERS 成功");

        // Step 1.5: 合并 i18n 翻译（ext-module + 游戏）
        if (window.ExternalModules.I18nRegister) {
            window.ExternalModules.I18nRegister.register();
            // 同步当前语言到 ExternalModules（让内部的 t() 函数使用正确语言）
            window.ExternalModules.I18nRegister.setCurrentLanguage(i18n._language);
            this.log("[ServiceBridge] i18n 翻译合并完成");
            i18n.updateSceneRenderers();
        }

        // Step 2: 执行自定义配置（如果有）
        if (this.customConfigures.length > 0) {
            this.log(`[ServiceBridge] 执行 ${this.customConfigures.length} 个自定义配置...`);
            try {
                this.customConfigures.forEach((configureFn, index) => {
                    this.log(`[ServiceBridge] 执行配置函数 ${index + 1}/${this.customConfigures.length}`);
                    configureFn();
                });
                this.log("[ServiceBridge] 所有自定义配置完成");
            } catch (error) {
                console.error("[ServiceBridge] 自定义配置失败:", error);
                throw error;
            }
        }

        // Step 3: 根据 GameConfig 配置服务
        // 设置 Logger 的日志级别
        const logger = this.getService<ILogger>(this.SERVICE_IDENTIFIERS.LOGGER);
        if (GameConfig.isDev) {
            // LogLevel.DEBUG = 0（输出所有日志）
            logger.setLevel(0);
            this.log("[ServiceBridge] Logger 设置为 DEBUG 模式");
        } else {
            // LogLevel.ERROR = 3（仅输出错误）
            logger.setLevel(3);
            this.log("[ServiceBridge] Logger 设置为 ERROR 模式");
        }

        // step 4: 初始化 GameApi
        this.GameApi = new GameApi(logger);

        // step 5: 初始化 GameService
        this.gameService = new GameService(
            logger,
            this.getService<IEventSystem>(this.SERVICE_IDENTIFIERS.EVENT_SYSTEM),
            this.getService<IGameStateManager>(this.SERVICE_IDENTIFIERS.GAME_STATE_MANAGER),
            this.GameApi
        );

        this.log("[ServiceBridge] 服务已就绪");

        this.isInitialized = true;

        // 自动切到 OPENING 状态（向后相容：若 ext-module 没 OPENING 则静默失败）
        try {
            const sm = this.getService<IGameStateManager>(this.SERVICE_IDENTIFIERS.GAME_STATE_MANAGER);
            if (window.ExternalModules.GAME_STATES.OPENING) {
                sm.changeState(window.ExternalModules.GAME_STATES.OPENING);
                this.log("[ServiceBridge] 进入 OPENING 状态");
            }
        } catch {
            // ext-module 没 OPENING 时静默
        }

        // listen LOADING_EVENTS.CLOSED → 自动 markGameReady（除非已 deferGameReady）
        try {
            const ev = this.getService<IEventSystem>(this.SERVICE_IDENTIFIERS.EVENT_SYSTEM);
            const loadingEvents = (window.ExternalModules as any).LOADING_EVENTS;
            if (loadingEvents && loadingEvents.CLOSED) {
                ev.on(loadingEvents.CLOSED, () => {
                    if (ServiceBridge._autoMarkReady) ServiceBridge.markGameReady();
                });
                this.log("[ServiceBridge] LOADING_EVENTS.CLOSED listener 已注册");
            }
        } catch (e) {
            this.log("[ServiceBridge] LOADING_EVENTS.CLOSED listener 注册失败:", e);
        }

        this.log("[ServiceBridge] ✅ 初始化成功");
    }

    /**
     * 检查是否已初始化
     */
    private static checkInitialized(): void {
        if (!this.isInitialized || !this.getService) {
            throw new Error("[ServiceBridge] 尚未初始化！请先调用 ServiceBridge.initialize()");
        }
    }

    /**
     * 重置 ServiceBridge（用于测试）
     */
    static reset(): void {
        this.getService = null;
        this.SERVICE_IDENTIFIERS = null;
        this.customConfigures = [];
        this.isInitialized = false;
        this.loggerProxy = null;
    }

    // ==================== Core Infrastructure ====================

    /**
     * 获取 Logger 服务（智能切换）
     *
     * 特点：
     * - 返回一个 Proxy 代理对象（Lazy Singleton，只创建一次）
     * - 初始化前：自动转发到 console（console.log/warn/error）
     * - 初始化后：自动切换到真实 Logger（支持日志级别、格式化等）
     * - 无需手动更新引用，自动切换对所有保存的引用生效
     *
     * 使用范例：
     * ```typescript
     * // 初始化前就可以安全使用
     * const logger = ServiceBridge.getLogger();
     * logger.info("test1");  // 输出到 console
     *
     * // 初始化后自动切换
     * await ServiceBridge.initialize();
     * logger.info("test2");  // 使用真实 Logger（同一个 logger 对象）
     * ```
     */
    static getLogger(): ILogger {
        // Lazy Singleton：只创建一次 Proxy
        if (!this.loggerProxy) {
            // Console fallback（初始化前使用）
            const consoleFallback = {
                debug: (...args: any[]) => {
                    if (GameConfig.isDev) console.log(...args);
                },
                info: (...args: any[]) => {
                    if (GameConfig.isDev) console.log(...args);
                },
                warn: (...args: any[]) => console.warn(...args),
                error: (...args: any[]) => console.error(...args),
                setLevel: () => {},
            };

            // 创建动态代理
            this.loggerProxy = new Proxy({} as ILogger, {
                get: (target, prop: string) => {
                    // 每次访问属性时，动态判断使用哪个 Logger
                    if (this.isInitialized && this.getService) {
                        // 已初始化：使用真实 Logger
                        const realLogger = this.getService<ILogger>(this.SERVICE_IDENTIFIERS.LOGGER);
                        return realLogger[prop];
                    } else {
                        // 未初始化：使用 console fallback
                        return consoleFallback[prop];
                    }
                },
            });
        }

        return this.loggerProxy;
    }

    /**
     * 获取 EventSystem 服务
     */
    static getEventSystem(): IEventSystem {
        this.checkInitialized();
        return this.getService<IEventSystem>(this.SERVICE_IDENTIFIERS.EVENT_SYSTEM);
    }

    /**
     * 获取 NetworkService 服务
     */
    static getNetworkService(): INetworkService {
        this.checkInitialized();
        return this.getService<INetworkService>(this.SERVICE_IDENTIFIERS.NETWORK_SERVICE);
    }

    /**
     * 创建对象池
     * 注意：ObjectPool 不是单例服务，每次调用都创建新实例
     */
    static createObjectPool<T>(factory: () => T, reset?: (obj: T) => void, maxSize?: number): IObjectPool<T> {
        this.checkInitialized();
        // ObjectPool 需要特殊处理，因为它需要工厂函数参数
        const ObjectPool = window.ExternalModules.ObjectPool;
        const logger = this.getService<ILogger>(this.SERVICE_IDENTIFIERS.LOGGER);
        return new ObjectPool(logger, factory, reset, maxSize) as IObjectPool<T>;
    }

    // ==================== UI/UX Layer ====================

    /**
     * 获取 ToastManager 服务
     */
    static getToastManager(): IToastManager {
        this.checkInitialized();
        return this.getService<IToastManager>(this.SERVICE_IDENTIFIERS.TOAST_MANAGER);
    }

    /**
     * 获取 DialogManager 服务
     */
    static getDialogManager(): IDialogManager {
        this.checkInitialized();
        return this.getService<IDialogManager>(this.SERVICE_IDENTIFIERS.DIALOG_MANAGER);
    }

    /**
     * 获取 LoadingManager 服务
     */
    static getLoadingManager(): ILoadingManager {
        this.checkInitialized();
        return this.getService<ILoadingManager>(this.SERVICE_IDENTIFIERS.LOADING_MANAGER);
    }

    /**
     * 获取 SettingsManager 服务
     */
    static getSettingsManager(): ISettingsManager {
        this.checkInitialized();
        return this.getService<ISettingsManager>(this.SERVICE_IDENTIFIERS.SETTINGS_MANAGER);
    }

    /**
     * 获取 GameStateManager 服务
     */
    static getGameStateManager(): IGameStateManager {
        this.checkInitialized();
        return this.getService<IGameStateManager>(this.SERVICE_IDENTIFIERS.GAME_STATE_MANAGER);
    }

    /**
     * 延后切换 STANDBY（给有开场表演的游戏用）
     * 必须在 initialize() 之前呼叫；之后 loading.hide 不会自动切，游戏端需自己呼 markGameReady
     */
    static deferGameReady(): void {
        this._autoMarkReady = false;
    }

    /**
     * 显式切到 STANDBY（给 deferGameReady 过的游戏在开场表演结束后呼叫）
     */
    static markGameReady(): void {
        try {
            const sm = this.getGameStateManager();
            if (sm.getCurrentState() === window.ExternalModules.GAME_STATES.OPENING) {
                sm.changeState(window.ExternalModules.GAME_STATES.STANDBY);
            }
        } catch (e) {
            // ext-module 未升级或 OPENING 不存在时 fail-safe
            console.warn("[ServiceBridge] markGameReady failed:", e);
        }
    }

    // ==================== Other Services ====================

    /**
     * 获取 AudioManager 服务
     */
    static getAudioManager(): IAudioManager {
        this.checkInitialized();
        return this.getService<IAudioManager>(this.SERVICE_IDENTIFIERS.AUDIO_MANAGER);
    }

    /**
     * 获取 Analytics 服务
     */
    static getAnalytics(): IAnalytics {
        this.checkInitialized();
        return this.getService<IAnalytics>(this.SERVICE_IDENTIFIERS.ANALYTICS);
    }

    /**
     * 获取 PlayerDataManager 服务
     */
    static getPlayerDataManager(): IPlayerDataManager {
        this.checkInitialized();
        return this.getService<IPlayerDataManager>(this.SERVICE_IDENTIFIERS.PLAYER_DATA_MANAGER);
    }

    /**
     * 获取 MaxMultiCapService 服务
     *
     * 用于检查 spin response 的 awards 中是否含有倍率上限虚拟奖，
     * 若有则弹 Dialog 通知玩家，await 确定后继续流程。
     */
    static getMaxMultiCapService(): IMaxMultiCapService {
        this.checkInitialized();
        return this.getService<IMaxMultiCapService>(this.SERVICE_IDENTIFIERS.MAX_MULTI_CAP_SERVICE);
    }

    /**
     * 获取 GameApi 服务
     */
    static getGameApi(): GameApi {
        this.checkInitialized();
        return this.GameApi;
    }

    /**
     * 获取 GameActionService 服务
     */
    static getGameActionService(): IGameActionService {
        this.checkInitialized();
        return this.getService<IGameActionService>(this.SERVICE_IDENTIFIERS.GAME_ACTION_SERVICE);
    }

    /**
     * 获取 GameService 服务
     */
    static getGameService(): GameService {
        this.checkInitialized();
        return this.gameService;
    }

    static getBundleManager(): IBundleManager {
        this.checkInitialized();
        return this.getService<IBundleManager>(this.SERVICE_IDENTIFIERS.BUNDLE_MANAGER);
    }

    // ==================== Config ====================
    /**
     * 获取游戏配置
     */
    static getGameConfig(): IGameConfig {
        return GameConfig;
    }

    /**
     * 获取游戏配置
     */
    static getConfig(): IGameConfig {
        return GameConfig;
    }

    // ==================== 便利方法：Toast ====================

    /**
     * Toast 便利访问器
     */
    static get toast() {
        const manager = this.getToastManager();
        return {
            show: (message: string, options?: IToastOptions) => manager.show(message, options),
            clear: () => manager.clear(),
        };
    }

    // ==================== 便利方法：Dialog ====================

    /**
     * Dialog 便利访问器（仿照 Toast 的便利设计）
     */
    static get dialog() {
        const manager = this.getDialogManager();
        return {
            /**
             * 显示对话框（完整选项）
             * @param options 对话框选项
             * @example
             * ServiceBridge.dialog.show({
             *   message: "确定要继续吗？",
             *   primaryButtonText: "确定",
             *   onPrimaryClick: () => console.log("确定"),
             *   secondaryButtonText: "取消"
             * });
             */
            show: (options: DialogOptions) => manager.show(options),

            /**
             * 显示提示对话框（仅确定按钮）
             * @param message 讯息内容
             * @param buttonText 按钮文字（预设："确定"）
             * @param onConfirm 确定回调
             * @example
             * ServiceBridge.dialog.alert("操作成功！");
             * ServiceBridge.dialog.alert("操作成功！", "好的", () => console.log("已确定"));
             */
            alert: (message: string, buttonText: string = i18n.t("common.confirm"), onConfirm?: () => void) => {
                manager.show({
                    message,
                    confirmButtonText: buttonText,
                    onConfirm: onConfirm,
                });
            },

            /**
             * 显示确认对话框（确定/取消按钮）
             * @param message 讯息内容
             * @param onConfirm 确定回调
             * @param onCancel 取消回调
             * @param confirmText 确定按钮文字（预设："确定"）
             * @param cancelText 取消按钮文字（预设："取消"）
             * @example
             * ServiceBridge.dialog.confirm(
             *   "确定要删除吗？",
             *   () => console.log("已删除"),
             *   () => console.log("已取消")
             * );
             */
            confirm: (
                message: string,
                onConfirm?: () => void,
                onCancel?: () => void,
                confirmText: string = i18n.t("common.confirm"),
                cancelText: string = i18n.t("common.cancel")
            ) => {
                manager.show({
                    message,
                    confirmButtonText: confirmText,
                    onConfirm: onConfirm,
                    cancelButtonText: cancelText,
                    onCancel: onCancel,
                });
            },

            /**
             * 关闭当前对话框
             */
            close: () => manager.close(),
        };
    }

    // ==================== 便利方法：Loading ====================

    /**
     * Loading 便利访问器
     *
     * 支持多实例管理：
     * - 不传 key：使用默认实例（向后兼容）
     * - 传入 key：使用命名实例
     *
     * @example
     * ```typescript
     * // 使用默认实例（向后兼容）
     * ServiceBridge.loading.show({ initialTip: "载入中..." });
     * ServiceBridge.loading.updateProgress(50);
     * ServiceBridge.loading.hide();
     *
     * // 注册命名实例
     * ServiceBridge.loading.register('game-panel', {
     *   loadingView: gamePanelLoadingView,
     * });
     *
     * // 使用命名实例
     * ServiceBridge.loading.show({ initialTip: "载入游戏..." }, 'game-panel');
     * ServiceBridge.loading.updateProgress(75, "载入完成", 'game-panel');
     * ServiceBridge.loading.hide('game-panel');
     *
     * // 检查实例是否存在
     * if (ServiceBridge.loading.hasInstance('game-panel')) {
     *   ServiceBridge.loading.show(null, 'game-panel');
     * }
     * ```
     */
    static get loading() {
        const manager = this.getLoadingManager();
        return {
            /**
             * 注册新的 Loading 实例
             * @param key 实例的唯一标识符
             * @param config Loading 配置
             * @param overwrite 是否允许覆盖已存在的实例（默认：false）
             */
            register: (key: string, config: ILoadingConfig, overwrite?: boolean) => manager.register(key, config, overwrite),

            /**
             * 检查实例是否存在
             * @param key 实例 key
             * @returns 存在返回 true
             */
            hasInstance: (key: string) => manager.hasInstance(key),

            /**
             * 显示 Loading（不传 key 使用默认实例）
             * @param options Loading 选项
             * @param key 实例 key（可选）
             */
            show: (options?: ILoadingOptions, key?: string) => manager.show(options, key),

            /**
             * 隐藏 Loading（不传 key 使用默认实例）
             * @param key 实例 key（可选）
             */
            hide: (key?: string) => {
                manager.hide(key);
            },

            /**
             * 更新进度（不传 key 使用默认实例）
             * @param progress 进度值 (0-100)
             * @param tip 提示文字（可选）
             * @param key 实例 key（可选）
             */
            updateProgress: (progress: number, tip?: string, key?: string) => manager.updateProgress(progress, tip, key),

            /**
             * 显示错误（不传 key 使用默认实例）
             * @param message 错误讯息
             * @param key 实例 key（可选）
             */
            showError: (message: string, key?: string) => manager.showError(message, key),

            /**
             * 重置（不传 key 使用默认实例）
             * @param key 实例 key（可选）
             */
            reset: (key?: string) => manager.reset(key),
        };
    }

    // ==================== 便利方法：Event ====================

    /**
     * 监听事件
     */
    static on(event: string, callback: (data?: unknown) => void, context?: any): void {
        this.getEventSystem().on(event, callback, context);
    }

    /**
     * 监听事件（仅一次）
     */
    static once(event: string, callback: (data?: unknown) => void, context?: any): void {
        this.getEventSystem().once(event, callback, context);
    }

    /**
     * 取消监听事件
     */
    static off(event: string, callback?: (data?: unknown) => void, context?: any): void {
        this.getEventSystem().off(event, callback, context);
    }

    /**
     * 触发事件
     */
    static emit(event: string, data?: unknown): void {
        this.getEventSystem().emit(event, data);
    }

    /**
     * 清除事件
     */
    static clearEvents(event?: string): void {
        this.getEventSystem().removeAllListeners(event);
    }

    // ==================== 便利方法：Network ====================

    /**
     * HTTP GET 请求
     */
    static async get<T = any>(url: string, config?: Partial<IRequestConfig>): Promise<IResponse<T>> {
        return this.getNetworkService().get<T>(url, config);
    }

    /**
     * HTTP POST 请求
     */
    static async post<T = any>(url: string, data?: unknown, config?: Partial<IRequestConfig>): Promise<IResponse<T>> {
        return this.getNetworkService().post<T>(url, data, config);
    }

    /**
     * HTTP PUT 请求
     */
    static async put<T = any>(url: string, data?: unknown, config?: Partial<IRequestConfig>): Promise<IResponse<T>> {
        return this.getNetworkService().put<T>(url, data, config);
    }

    /**
     * HTTP DELETE 请求
     */
    static async delete<T = any>(url: string, config?: Partial<IRequestConfig>): Promise<IResponse<T>> {
        return this.getNetworkService().delete<T>(url, config);
    }

    /**
     * 通用 HTTP 请求
     */
    static async request<T = any>(config: IRequestConfig): Promise<IResponse<T>> {
        return this.getNetworkService().request<T>(config);
    }

    // ==================== 便利方法：Settings ====================

    // TODO: 等待 ISettingsManager 接口实现以下方法后取消注解
    // /**
    //  * 获取设置
    //  */
    // static getSetting<T = any>(key: string, defaultValue?: T): T {
    //   return this.getSettingsManager().get(key, defaultValue);
    // }

    // /**
    //  * 设置设置
    //  */
    // static setSetting(key: string, value: any): void {
    //   this.getSettingsManager().set(key, value);
    // }

    // /**
    //  * 检查设置是否存在
    //  */
    // static hasSetting(key: string): boolean {
    //   return this.getSettingsManager().has(key);
    // }

    // /**
    //  * 移除设置
    //  */
    // static removeSetting(key: string): void {
    //   this.getSettingsManager().remove(key);
    // }

    // /**
    //  * 清空所有设置
    //  */
    // static clearSettings(): void {
    //   this.getSettingsManager().clear();
    // }

    // ==================== 便利方法：Audio ====================

    /**
     * 播放音乐
     * @param musicKey BGM 的 key（在 config.bgm 中定义）
     * @param loop 是否循环播放
     */
    static async playMusic(musicKey: string, loop = true): Promise<void> {
        await this.getAudioManager().playMusic(musicKey, loop);
    }

    /**
     * 停止音乐
     */
    static stopMusic(): void {
        this.getAudioManager().stopMusic();
    }

    static skipMusic(skipTime: number): void {
        this.getAudioManager().skipMusic(skipTime);
    }

    static setBgmVolume(volume: number): void {
        this.getAudioManager().setBgmVolume(volume);
    }

    static fadeBgmVolume(targetVolume: number, duration: number): void {
        this.getAudioManager().fadeBgmVolume(targetVolume, duration);
    }

    /**
     * 播放音效（从 Audio Sprite）
     * @param soundKey 音效的 key（在 sprite.sprite 中定义）
     * @param loop 是否循环播放（预设 false）
     * @returns 音效句柄，用于控制播放；如果播放失败则返回 null
     *
     * @example
     * ```typescript
     * // 播放一次性音效
     * await ServiceBridge.playSound('buttonClick');
     *
     * // 循环播放音效，并保留句柄以便稍后停止
     * const handle = await ServiceBridge.playSound('ambientLoop', true);
     * // ... 稍后停止
     * handle?.stop();
     * ```
     */
    static async playSound(soundKey: string, loop = false): Promise<ISoundHandle | null> {
        return await this.getAudioManager().playSound(soundKey, loop);
    }

    /**
     * 停止特定音效
     * 会停止所有该 soundKey 的实例（包括循环播放的）
     *
     * @param soundKey 音效的 key
     *
     * @example
     * ```typescript
     * // 播放循环音效
     * await ServiceBridge.playSound('ambientLoop', true);
     *
     * // 停止该音效
     * ServiceBridge.stopSound('ambientLoop');
     * ```
     */
    static stopSound(soundKey: string): void {
        this.getAudioManager().stopSound(soundKey);
    }

    // ==================== 便利方法：I18n ====================

    // ==================== 便利方法：Analytics ====================

    // TODO: 等待 IAnalytics 接口实现以下方法后取消注解
    // /**
    //  * 追踪事件
    //  */
    // static track(event: string, properties?: Record<string, any>): void {
    //   this.getAnalytics().track(event, properties);
    // }

    // /**
    //  * 识别用户
    //  */
    // static identify(userId: string, traits?: Record<string, any>): void {
    //   this.getAnalytics().identify(userId, traits);
    // }

    // /**
    //  * 追踪页面
    //  */
    // static trackPage(name: string, properties?: Record<string, any>): void {
    //   this.getAnalytics().page(name, properties);
    // }

    // ==================== 便利方法：PlayerData ====================

    /**
     * PlayerData 便利访问器
     *
     * 提供玩家数据管理的简洁访问方式
     *
     * @example
     * ```typescript
     * // 查询数据
     * const balance = ServiceBridge.playerData.getBalance();
     * const playerId = ServiceBridge.playerData.getPlayerId();
     * const hasEnough = ServiceBridge.playerData.hasEnoughBalance(100);
     *
     * // 更新数据
     * ServiceBridge.playerData.setBalance(1000);
     * ServiceBridge.playerData.addBalance(-50);  // 扣除 50
     * ServiceBridge.playerData.setBetAmount(10);
     *
     * // 设置完整数据
     * ServiceBridge.playerData.setData({
     *   playerId: "player_123",
     *   balance: 1000,
     *   betAmount: 10,
     *   playerToken: "token_abc",
     * });
     *
     * // 监听变化（通过 EventSystem）
     * ServiceBridge.on(
     *   window.ExternalModules.PLAYER_DATA_EVENTS.BALANCE_CHANGED,
     *   (data) => console.log('余额变化:', data),
     *   this
     * );
     * ```
     */
    static get playerData() {
        const manager = this.getPlayerDataManager();
        return {
            // 查询
            getPlayerId: () => manager.getPlayerId(),
            getBalance: () => manager.getBalance(),
            getBetAmount: () => manager.getBetAmount(),
            getToken: () => manager.getPlayerToken(),
            getOperatorId: () => manager.getOperatorId(),
            getCurrency: () => manager.getCurrency(),
            getData: () => manager.getPlayerData(),
            hasEnoughBalance: (amount: number) => manager.hasEnoughBalance(amount),

            // 更新
            setData: (data: IPlayerData) => manager.setPlayerData(data),
            setBalance: (balance: number) => manager.setBalance(balance),
            addBalance: (amount: number) => manager.addBalance(amount),
            setBetAmount: (betAmount: number) => manager.setBetAmount(betAmount),
            setToken: (token: string) => manager.setPlayerToken(token),
            setOperatorId: (operatorId: string) => manager.setOperatorId(operatorId),
            setCurrency: (currency: string) => manager.setCurrency(currency),

            // 状态
            clear: () => manager.clear(),
        };
    }

    // ==================== 便利方法：Config ====================

    /**
     * Config 便利访问器
     *
     * @example
     * ```typescript
     * // 访问 Bridge 配置
     * const apiUrl = ServiceBridge.config.bridge.api.baseUrl;
     * const env = ServiceBridge.config.bridge.environment;
     *
     * // 访问游戏配置
     * const gameId = ServiceBridge.config.game.gameId;
     * const reelCount = ServiceBridge.config.game.reels?.count;
     * ```
     */
    static get config(): IGameConfig {
        return this.getConfig();
    }

    // ==================== 便利方法：Utils ====================

    /**
     * Utils 工具函数便利访问器
     *
     * @example
     * ```typescript
     * // 数字格式化
     * ServiceBridge.utils.formatNumber(1500000); // "1.5M"
     * ServiceBridge.utils.formatWithCommas(123456); // "123,456"
     * ServiceBridge.utils.clamp(150, 0, 100); // 100
     *
     * // 字串工具
     * ServiceBridge.utils.stringToBoolean("true"); // true
     * ServiceBridge.utils.formatString("玩家 %s 获得 %d 金币", "Alice", 100);
     *
     * // 函数工具
     * const search = ServiceBridge.utils.debounce(fn, 300);
     * const scroll = ServiceBridge.utils.throttle(fn, 200);
     * ```
     */
    static get utils(): IUtils {
        if (!window.ExternalModules) {
            throw new Error("[ServiceBridge] window.ExternalModules 未载入，无法访问 utils");
        }

        return {
            // Number Utils
            formatNumber: window.ExternalModules.formatNumber,
            formatWithCommas: window.ExternalModules.formatWithCommas,
            clamp: window.ExternalModules.clamp,

            // String Utils
            stringToBoolean: window.ExternalModules.stringToBoolean,
            formatString: window.ExternalModules.formatString,

            // Function Utils
            debounce: window.ExternalModules.debounce,
            throttle: window.ExternalModules.throttle,

            //Array Utils
            splitArrayIntoSegments: window.ExternalModules.splitArrayIntoSegments,
        };
    }

    // ==================== 常量访问器 ====================

    /**
     * 游戏状态常量
     *
     * @example
     * ```typescript
     * const states = ServiceBridge.GAME_STATES;
     * gameStateManager.setState(states.SPINNING);
     * ```
     */
    static get GAME_STATES(): GAME_STATES_TYPE {
        if (!window.ExternalModules) {
            throw new Error("[ServiceBridge] window.ExternalModules 未载入");
        }
        return window.ExternalModules.GAME_STATES;
    }

    /**
     * 游戏状态事件常量
     *
     * @example
     * ```typescript
     * const events = ServiceBridge.GAME_STATE_EVENTS;
     * ServiceBridge.on(events.CHANGED, callback);
     * ```
     */
    static get GAME_STATE_EVENTS(): GAME_STATE_EVENTS_TYPE {
        if (!window.ExternalModules) {
            throw new Error("[ServiceBridge] window.ExternalModules 未载入");
        }
        return window.ExternalModules.GAME_STATE_EVENTS;
    }

    /**
     * 自动旋转事件常量
     *
     * @example
     * ```typescript
     * const events = ServiceBridge.AUTO_SPIN_EVENTS;
     * ServiceBridge.on(events.START, callback);
     * eventSystem.emit(events.STOP);
     * ```
     */
    static get AUTO_SPIN_EVENTS() {
        if (!window.ExternalModules) {
            throw new Error("[ServiceBridge] window.ExternalModules 未载入");
        }
        return window.ExternalModules.AUTO_SPIN_EVENTS;
    }

    /**
     * 玩家数据事件常量
     *
     * @example
     * ```typescript
     * const events = ServiceBridge.PLAYER_DATA_EVENTS;
     * ServiceBridge.on(events.BALANCE_CHANGED, (data) => {
     *   console.log('余额变化:', data.newBalance);
     * });
     * ```
     */
    static get PLAYER_DATA_EVENTS(): PLAYER_DATA_EVENTS_TYPE {
        if (!window.ExternalModules) {
            throw new Error("[ServiceBridge] window.ExternalModules 未载入");
        }
        return window.ExternalModules.PLAYER_DATA_EVENTS;
    }

    // ==================== 辅助方法 ====================

    /**
     * 记录服务调用（如果启用）
     */

    /**
     * 记录日志
     */
    private static log(...args: any[]): void {
        if (GameConfig.isDev) {
            console.log(...args);
        }
    }

    static async loadBundle(configs: IBundleConfig[]): Promise<IBundle[] | null> {
        return this.getBundleManager().loadBundle(configs);
    }
}
