/**
 * HostBridge 接口
 *
 * 用于 Web 环境下，Cocos 游戏（iframe）与 Vue Host 宿主页面之间的通信
 */
/**
 * 用户信息（从 Host 接收）
 */
export interface UserInfo {
    operatorId: string;
    userId: string;
    balance: number;
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
/**
 * IHostBridge 接口
 *
 * 提供与 Host 页面通信的功能
 */
export interface IHostBridge {
    /**
     * 初始化 HostBridge
     * 注册 message 事件监听
     */
    initialize(): void;
    /**
     * 销毁 HostBridge
     */
    destroy(): void;
    /**
     * 请求打开弹窗
     * @param modalKey 弹窗类型：'paytable' | 'rules' | 'history' | 'balance'
     * @returns 是否成功发送请求（不在 iframe 中时返回 false）
     */
    openModal(modalKey: string): boolean;
    /**
     * 注册弹窗打开回调
     */
    onModalOpened(callback: ModalCallback): void;
    /**
     * 注册弹窗关闭回调
     */
    onModalClosed(callback: ModalCallback): void;
    /**
     * 移除弹窗打开回调
     */
    offModalOpened(callback: ModalCallback): void;
    /**
     * 移除弹窗关闭回调
     */
    offModalClosed(callback: ModalCallback): void;
    /**
     * 向 Host 请求 token
     */
    requestToken(): void;
    /**
     * 获取当前 token（同步）
     * @returns token 或 null（如果尚未收到）
     */
    getToken(): string | null;
    /**
     * 获取当前用户信息（同步）
     * @returns userInfo 或 null（如果尚未收到）
     */
    getUserInfo(): UserInfo | null;
    /**
     * 获取当前语言（同步）
     * @returns 语言代码（'en' 或 'zh'，默认 'en'）
     */
    getLanguage(): string;
    /**
     * 检查 token 是否就绪
     */
    isTokenReady(): boolean;
    /**
     * 等待 token 就绪
     * @returns Promise<string> 返回 token
     */
    waitForToken(): Promise<string>;
    /**
     * 注册 token 接收回调
     */
    onTokenReceived(callback: TokenCallback): void;
    /**
     * 移除 token 接收回调
     */
    offTokenReceived(callback: TokenCallback): void;
    /**
     * 通知 Host token 失效（如收到 401）
     * @param status HTTP 状态码
     */
    reportAuthInvalid(status?: number): void;
    /**
     * 通知 Host 游戏资源已加载完成
     */
    notifyGameReady(): void;
    /**
     * 通知 Host 游戏请求退出
     * Host 会隐藏游戏 iframe 并显示退出页面
     */
    exitGame(): void;
    /**
     * 注册 Spin 操作回调（Host 通过空格键触发）
     */
    onSpin(callback: () => void): void;
    /**
     * 移除 Spin 操作回调
     */
    offSpin(callback: () => void): void;
}
//# sourceMappingURL=IHostBridge.d.ts.map