import type { IFeatureBuyContentView } from "./IFeatureBuyContentView";
import type { ILogger } from "../../core/Logger/ILogger";
/**
 * FeatureBuyPanel 抽象邏輯層
 *
 * 職責：提供特色功能購買面板的基礎邏輯，可被子類繼承和擴展
 */
export declare abstract class AbstractFeatureBuyContentViewLogic {
    protected view: IFeatureBuyContentView;
    protected logger: ILogger;
    /** 音效按鈕邏輯管理器 */
    private audioButtons;
    /** 節點原始位置（用於動畫恢復） */
    private originalPosition;
    /** ContentBackground 高度（用於動畫偏移計算） */
    private contentHeight;
    constructor(view: IFeatureBuyContentView, logger: ILogger);
    /**
     * 設置節點透明度（遞歸設置所有子節點）
     */
    private setNodeOpacity;
    /**
     * 快取 contentBackground 的原始位置與高度（供動畫使用）
     */
    private cacheLayoutInfo;
    /**
     * 綁定單一按鈕的音效邏輯與點擊事件
     */
    private bindButton;
    /**
     * 解除單一按鈕的點擊事件
     */
    private unbindButton;
    /**
     * 取得 GameActionService
     */
    private getGameActionService;
    /**
     * 執行關閉面板動作（cancel / mask 共用）
     */
    private performCloseAction;
    /**
     * 顯示面板
     * @param animated 是否播放動畫（默認 true）
     */
    show(animated?: boolean): void;
    /**
     * 隱藏面板
     * @param animated 是否播放動畫（默認 true）
     */
    hide(animated?: boolean): void;
    /**
     * 更新價格標籤
     * @param price 購買價格
     */
    updatePrice(price: number): void;
    /**
     * 初始化（記錄動畫位置，綁定按鈕事件）
     */
    initialize(): void;
    /**
     * 銷毀（解除所有事件綁定）
     */
    destroy(): void;
    /**
     * 綁定按鈕事件（含音效）
     */
    protected bindButtonEvents(): void;
    /**
     * 解除按鈕事件綁定
     */
    protected unbindButtonEvents(): void;
    /**
     * 確認購買按鈕點擊處理
     */
    protected onStartButtonClick(): Promise<void>;
    /**
     * 取消按鈕點擊處理
     */
    protected onCancelButtonClick(): Promise<void>;
    /**
     * 遮罩按鈕點擊處理（點擊背景關閉面板）
     */
    protected onMaskButtonClick(): Promise<void>;
}
//# sourceMappingURL=AbstractFeatureBuyContentViewLogic.d.ts.map