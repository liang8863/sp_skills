import type { Node } from "cc";
import type { IFeatureBuyContentView } from "./IFeatureBuyContentView";
import type { IAudioButtonView } from "../Common/IAudioButtonView";
/**
 * FeatureBuyPanel 容器 View 接口
 *
 * 職責：提供面板根節點及內容子組件的訪問器
 * 由 FeatureBuyLogic 使用
 */
export interface IFeatureBuyPanelView {
    /**
     * 獲取 FeatureBuyPanel 根節點
     */
    getNode(): Node;
    /**
     * 獲取內容子組件（包含所有控制元件）
     */
    getContentView(): IFeatureBuyContentView | null;
    /**
     * 獲取觸發開啟 FeatureBuy 面板的按鈕（可選）
     */
    getFeatureBuyBtn?(): IAudioButtonView | null;
}
//# sourceMappingURL=IFeatureBuyPanelView.d.ts.map