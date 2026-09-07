import type { Node } from "cc";
import type { IMarqueeBarView } from "./IMarqueeBarView";
import type { IInfoBarView } from "./IInfoBarView";
import type { IControlPanelView } from "./IControlPanelView";
import type { IMenuPanelView } from "./IMenuPanelView";
import type { IBetPanelView } from "./IBetPanelView";
import type { IReelsContainerView } from "./IReelsContainerView";
import type { IAutoSpinPanelView } from "./IAutoSpinPanelView";
/**
 * GamePanel View 接口（容器）
 *
 * 職責：提供 GamePanel 容器和 7 個子組件的訪問器
 */
export interface IGamePanelView {
    /**
     * 獲取 GamePanel 根節點
     */
    getNode(): Node;
    /**
     * 獲取 MarqueeBar 組件
     */
    getMarqueeBar(): IMarqueeBarView | null;
    /**
     * 獲取 InfoBar 組件
     */
    getInfoBar(): IInfoBarView | null;
    /**
     * 獲取 ControlPanel 組件
     */
    getControlPanel(): IControlPanelView | null;
    /**
     * 獲取 MenuPanel 組件
     */
    getMenuPanel(): IMenuPanelView | null;
    /**
     * 獲取 BetPanel 組件
     */
    getBetPanel(): IBetPanelView | null;
    /**
     * 獲取 ReelsContainer 組件
     */
    getReelsContainer(): IReelsContainerView | null;
    /**
     * 獲取 AutoSpinPanel 組件
     */
    getAutoSpinPanel(): IAutoSpinPanelView | null;
}
//# sourceMappingURL=IGamePanelView.d.ts.map