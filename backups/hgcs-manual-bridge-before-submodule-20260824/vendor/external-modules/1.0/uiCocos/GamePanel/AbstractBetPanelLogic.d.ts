import type { IBetPanelView } from "./IBetPanelView";
import type { ILogger } from "../../core/Logger/ILogger";
/**
 * BetPanel 抽象邏輯層
 *
 * 職責：提供下注資訊面板的基礎邏輯，可被子類繼承和擴展
 */
export declare abstract class AbstractBetPanelLogic {
    protected view: IBetPanelView;
    protected logger: ILogger;
    /** 節點原始位置（用於動畫恢復） */
    private originalPosition;
    /** ContentBackground 高度（用於動畫偏移計算） */
    private contentHeight;
    /** 當前貨幣代號（顯示金額時前綴對應符號；未設定時不顯示符號） */
    protected currency: string;
    constructor(view: IBetPanelView, logger: ILogger);
    /**
     * 設定貨幣代號（影響 picker 與 InfoBar 顯示的前綴符號）
     */
    setCurrency(currency: string): void;
    /**
     * 更新 InfoBar 顯示
     * @param balance 餘額
     * @param bet 下注金額
     * @param win 贏得金額
     */
    updateInfoBar(balance: number, bet: number, win: number): void;
    /**
     * 設置節點透明度（遞歸設置所有子節點）
     * @param node 目標節點
     * @param opacity 透明度 (0-255)
     */
    private setNodeOpacity;
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
     * 初始化（預留給子類擴展）
     */
    initialize(): void;
}
//# sourceMappingURL=AbstractBetPanelLogic.d.ts.map