import type { Node, Label } from "cc";
import type { IAudioButtonView } from "../Common/IAudioButtonView";
/**
 * FeatureBuyPanel 內容子組件 View 接口
 *
 * 職責：提供面板內部控制元件的訪問器（按鈕、動畫節點、標籤）
 * 由 AbstractFeatureBuyPanelLogic 使用
 */
export interface IFeatureBuyContentView {
    /**
     * 獲取內容子組件根節點
     */
    getNode(): Node;
    /**
     * 獲取確認購買按鈕
     */
    getStartButton(): IAudioButtonView | null;
    /**
     * 獲取取消/關閉按鈕
     */
    getCancelButton(): IAudioButtonView | null;
    /**
     * 獲取遮罩按鈕（點擊背景關閉面板）
     */
    getMaskButton(): IAudioButtonView | null;
    /**
     * 獲取內容背景節點（用於滑入滑出動畫）
     */
    getContentBackground(): Node | null;
    /**
     * 獲取價格標籤
     */
    getPriceLabel(): Label | null;
}
//# sourceMappingURL=IFeatureBuyContentView.d.ts.map