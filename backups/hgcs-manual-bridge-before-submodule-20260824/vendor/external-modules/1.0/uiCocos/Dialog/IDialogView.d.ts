import { Node, Label, Sprite, Button } from "cc";
/**
 * Dialog View 接口（超薄殼 - 只提供訪問器）
 *
 * Dialog View 只負責提供 Cocos 組件的訪問，所有業務邏輯由 DialogViewLogic 處理
 */
export interface IDialogView {
    /**
     * 獲取 Dialog 根節點
     */
    getNode(): Node;
    /**
     * 獲取消息 Label
     */
    getLabel(): Label;
    /**
     * 獲取背景 Sprite
     */
    getBackgroundSprite(): Sprite;
    /**
     * 獲取黑底遮罩 Sprite（全版面，可點擊作為取消功能）
     */
    getMaskButton(): Button | null;
    /**
     * 獲取確認按鈕
     */
    getConfirmButton(): Button | null;
    /**
     * 獲取取消按鈕
     */
    getCancelButton(): Button | null;
}
//# sourceMappingURL=IDialogView.d.ts.map