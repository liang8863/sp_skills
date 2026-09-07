/**
 * LoadingView 接口定義
 *
 * 遊戲專案需要在 Prefab 根節點的組件中實現這個接口
 */
import type { Node, ProgressBar, Label, Button } from "cc";
export interface ILoadingView {
    /**
     * 獲取根節點
     */
    getNode(): Node;
    /**
     * 獲取進度條組件
     */
    getProgressBar(): ProgressBar | null;
    /**
     * 獲取進度文字標籤（顯示百分比）
     */
    getProgressText(): Label | null;
    /**
     * 獲取提示文字標籤
     */
    getTipText(): Label | null;
    /**
     * 獲取 Logo 節點（可選）
     */
    getLogoNode?(): Node | null;
    /**
     * 獲取關閉按鈕（可選）
     * 當進度到達 100% 時顯示，點擊後關閉 Loading
     */
    getCloseButton?(): Button | null;
}
//# sourceMappingURL=ILoadingView.d.ts.map