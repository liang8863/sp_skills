import { IAnalytics, AnalyticsEvent, AnalyticsEventType, PerformanceMetrics } from "./IAnalytics";
import { ILogger } from "../core/Logger/ILogger";
/**
 * Analytics 實現骨架
 *
 * 功能：
 * - 追蹤遊戲事件、用戶行為、性能指標、錯誤
 * - 支持多個分析平台（GA、自定義端點等）
 * - 本地緩存和批量上傳
 *
 * TODO: 後續補充完整實現
 * - 集成第三方分析平台（Google Analytics、Firebase 等）
 * - 事件批量上傳
 * - 離線緩存
 * - 自動性能監控
 */
export declare class Analytics implements IAnalytics {
    private logger;
    private userId;
    private sessionId;
    private customProperties;
    private eventQueue;
    private config;
    constructor(logger: ILogger);
    initialize(config?: Record<string, any>): void;
    trackEvent(event: AnalyticsEvent): void;
    trackGameEvent(type: AnalyticsEventType, data?: Record<string, any>): void;
    trackUserAction(action: string, data?: Record<string, any>): void;
    trackPerformance(metrics: PerformanceMetrics): void;
    trackError(error: Error, context?: Record<string, any>): void;
    setUserId(userId: string): void;
    setSessionId(sessionId: string): void;
    setCustomProperty(key: string, value: any): void;
    getSessionId(): string;
    clear(): void;
    /**
     * 生成會話 ID
     */
    private generateSessionId;
    /**
     * 批量上傳事件
     * TODO: 實現
     */
    private flush;
    /**
     * 發送到分析平台
     * TODO: 實現
     */
    private sendToAnalyticsPlatform;
}
//# sourceMappingURL=Analytics.d.ts.map