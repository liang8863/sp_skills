import type { ILogger } from "../../core/Logger/ILogger";
import { AbstractFeatureBuyContentViewLogic } from "./AbstractFeatureBuyContentViewLogic";
import type { IFeatureBuyPanelView } from "./IFeatureBuyPanelView";
import type { IFeatureBuyContentView } from "./IFeatureBuyContentView";
/**
 * FeatureBuyLogic 配置接口
 */
export interface FeatureBuyLogicConfig {
    /**
     * 自定義內容邏輯類（可選）
     * 若不傳，使用 AbstractFeatureBuyContentViewLogic 的匿名具體子類
     */
    featureBuyPanelLogicClass?: new (view: IFeatureBuyContentView, logger: ILogger) => AbstractFeatureBuyContentViewLogic;
    /**
     * 購買金額倍率
     */
    featureBuyPriceRate?: number;
    /**
     * 確認購買回調（可選）
     * 由遊戲層提供，當玩家確認購買時調用
     */
    confirmHandler?: () => Promise<void>;
}
/**
 * FeatureBuyLogic — FeatureBuyPanel 的獨立 Logic 管理器
 *
 * 職責：
 * - 管理 AbstractFeatureBuyContentViewLogic 實例的生命週期
 * - 綁定觸發開啟面板的 featureBuyBtn
 * - 註冊 OPEN / CLOSE / CONFIRM_FEATURE_BUY 的 GameAction executor
 * - 提供 show() / hide() / updatePrice() 對外介面
 *
 * 與 GamePanelLogic 平行存在，在 Bootstrap 中獨立初始化。
 *
 * @example
 * ```typescript
 * const featureBuyLogic = new FeatureBuyLogic(
 *     featureBuyPanelView,
 *     logger,
 *     { confirmHandler: async () => { ... } }
 * );
 * featureBuyLogic.initialize();
 * ```
 */
export declare class FeatureBuyLogic {
    private view;
    private logger;
    private config?;
    private featureBuyPanelLogic;
    private featureBuyBtnAudioLogic;
    constructor(view: IFeatureBuyPanelView, logger: ILogger, config?: FeatureBuyLogicConfig | undefined);
    initialize(): void;
    destroy(): void;
    /** 顯示面板 */
    show(animated?: boolean): void;
    /** 隱藏面板 */
    hide(animated?: boolean): void;
    /** 更新價格標籤 */
    updatePrice(price: number): void;
    /** 獲取內容邏輯實例（供子類或外部擴展） */
    getContentLogic(): AbstractFeatureBuyContentViewLogic | null;
    private initFeatureBuyBtn;
    private destroyFeatureBuyBtn;
    private onFeatureBuyBtnClick;
    protected createContentLogic(view: IFeatureBuyContentView): AbstractFeatureBuyContentViewLogic;
    protected registerGameActions(): void;
}
//# sourceMappingURL=FeatureBuyLogic.d.ts.map