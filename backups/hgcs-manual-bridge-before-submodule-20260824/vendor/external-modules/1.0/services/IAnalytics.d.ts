/**
 * Analytics 接口定義
 *
 * 數據追蹤和分析系統
 * 用於追蹤：
 * - 遊戲事件（spin、win、lose 等）
 * - 用戶行為（button click、scene change 等）
 * - 性能指標（loading time、fps 等）
 * - 錯誤追蹤（異常、崩潰等）
 */
export declare enum AnalyticsEventType {
    GAME_START = "game:start",
    GAME_SPIN = "game:spin",
    GAME_WIN = "game:win",
    GAME_LOSE = "game:lose",
    GAME_BET = "game:bet",
    GAME_FEATURE_TRIGGERED = "game:featureTriggered",
    USER_BUTTON_CLICK = "user:buttonClick",
    USER_SCENE_CHANGE = "user:sceneChange",
    USER_SETTINGS_CHANGED = "user:settingsChanged",
    USER_LOGIN = "user:login",
    USER_LOGOUT = "user:logout",
    PERF_LOADING_TIME = "perf:loadingTime",
    PERF_FPS = "perf:fps",
    PERF_MEMORY = "perf:memory",
    ERROR_EXCEPTION = "error:exception",
    ERROR_NETWORK = "error:network",
    ERROR_RESOURCE_LOAD = "error:resourceLoad"
}
export interface AnalyticsEvent {
    /**
     * 事件類型
     */
    type: AnalyticsEventType | string;
    /**
     * 事件數據
     */
    data?: Record<string, any>;
    /**
     * 時間戳
     */
    timestamp?: number;
    /**
     * 用戶 ID（如有）
     */
    userId?: string;
    /**
     * 會話 ID
     */
    sessionId?: string;
}
export interface PerformanceMetrics {
    /**
     * 載入時間（毫秒）
     */
    loadingTime?: number;
    /**
     * 當前 FPS
     */
    fps?: number;
    /**
     * 記憶體使用（MB）
     */
    memory?: number;
}
export interface IAnalytics {
    /**
     * 初始化分析系統
     * @param config 配置（例如：GA ID、自定義端點等）
     */
    initialize(config?: Record<string, any>): void;
    /**
     * 追蹤事件
     */
    trackEvent(event: AnalyticsEvent): void;
    /**
     * 追蹤遊戲事件（便捷方法）
     */
    trackGameEvent(type: AnalyticsEventType, data?: Record<string, any>): void;
    /**
     * 追蹤用戶行為（便捷方法）
     */
    trackUserAction(action: string, data?: Record<string, any>): void;
    /**
     * 追蹤性能指標
     */
    trackPerformance(metrics: PerformanceMetrics): void;
    /**
     * 追蹤錯誤
     */
    trackError(error: Error, context?: Record<string, any>): void;
    /**
     * 設置用戶 ID
     */
    setUserId(userId: string): void;
    /**
     * 設置會話 ID
     */
    setSessionId(sessionId: string): void;
    /**
     * 設置自定義屬性（用於所有後續事件）
     */
    setCustomProperty(key: string, value: any): void;
    /**
     * 獲取會話 ID
     */
    getSessionId(): string;
    /**
     * 清除所有追蹤數據（用於用戶登出）
     */
    clear(): void;
}
//# sourceMappingURL=IAnalytics.d.ts.map