import type { IReelsContainerView } from "./IReelsContainerView";
import type { ILogger } from "../../core/Logger/ILogger";
import type { Node } from "cc";
/**
 * ReelsContainer 抽象邏輯層
 *
 * 職責：提供滾輪容器的基礎邏輯，可被子類繼承和擴展
 */
export declare abstract class AbstractReelsContainerLogic {
    protected view: IReelsContainerView;
    protected logger: ILogger;
    constructor(view: IReelsContainerView, logger: ILogger);
    /**
     * 獲取滾輪容器節點（供外部遊戲邏輯使用）
     * @returns 滾輪容器節點，若未綁定則返回 null
     */
    getContainer(): Node | null;
    /**
     * 顯示組件
     */
    show(): void;
    /**
     * 隱藏組件
     */
    hide(): void;
    /**
     * 初始化（預留給子類擴展）
     */
    initialize(): void;
}
//# sourceMappingURL=AbstractReelsContainerLogic.d.ts.map