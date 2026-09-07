import { Node } from "cc";
import { ILoadingView } from "./ILoadingView";
import type { ILogger } from "../../core/Logger/ILogger";
/**
 * Loading View Logic 抽象基類
 *
 * 提供通用的 Loading 邏輯接口，子類可以重寫任何方法來定制行為
 * Manager 和 Bridge 只依賴這個抽象類，不關心具體實現
 */
export declare abstract class AbstractLoadingViewLogic {
    protected view: ILoadingView;
    protected logger: ILogger;
    protected isVisible: boolean;
    constructor(view: ILoadingView, logger: ILogger);
    /**
     * 顯示 Loading
     * 子類可以重寫來定制顯示動畫
     */
    show(message?: string): void;
    /**
     * 隱藏 Loading
     * 子類可以重寫來定制隱藏動畫
     */
    hide(): void;
    /**
     * 更新進度（0-1）
     * 子類可以重寫來定制進度顯示方式
     */
    updateProgress(progress: number): void;
    updateTip(tip: string): void;
    /**
     * 顯示錯誤訊息
     * 子類可以重寫來定制錯誤顯示方式（例如紅色、震動等）
     */
    showError(message: string): void;
    /**
     * 重置狀態
     * 子類可以重寫來定制重置邏輯
     */
    reset(): void;
    /**
     * 重置顏色（移除錯誤狀態）
     * 子類可以重寫
     */
    resetColor(): void;
    /**
     * 獲取節點
     */
    getNode(): Node;
    /**
     * 是否正在顯示
     */
    isShowing(): boolean;
    /**
     * 設置關閉按鈕事件
     */
    private setupCloseButton;
    /**
     * 關閉按鈕點擊處理
     *
     * 廣播 LOADING_EVENTS.CLOSED：上層（如 ServiceBridge）可監聽並決定是否要自動 markGameReady
     * 取 eventSystem 失敗（容器尚未初始化等）只 warn 不丟錯，hide() 仍照走
     */
    private onCloseButtonClick;
    /**
     * 清理資源（如果 View 被銷毀）
     */
    onDestroy(): void;
}
//# sourceMappingURL=AbstractLoadingViewLogic.d.ts.map