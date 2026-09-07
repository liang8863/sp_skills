import type { Node, Sprite } from "cc";
import type { IAudioButtonView } from "../Common/IAudioButtonView";
/**
 * MenuPanel View 接口
 *
 * 職責：提供選單面板 UI 元素訪問器
 */
export interface IMenuPanelView {
    /**
     * 獲取根節點
     */
    getNode(): Node;
    /**
     * 獲取 Quit 按鈕
     */
    getQuitButton(): IAudioButtonView | null;
    /**
     * 獲取 Sound 按鈕
     */
    getSoundButton(): IAudioButtonView | null;
    /**
     * 獲取 Sound 開啟狀態的 Sprite
     */
    getSoundOnSprite(): Sprite | null;
    /**
     * 獲取 Sound 關閉狀態的 Sprite
     */
    getSoundOffSprite(): Sprite | null;
    /**
     * 獲取 Paytable 按鈕
     */
    getPaytableButton(): IAudioButtonView | null;
    /**
     * 獲取 Rules 按鈕
     */
    getRulesButton(): IAudioButtonView | null;
    /**
     * 獲取 History 按鈕
     */
    getHistoryButton(): IAudioButtonView | null;
    /**
     * 獲取 Close 按鈕
     */
    getCloseButton(): IAudioButtonView | null;
}
//# sourceMappingURL=IMenuPanelView.d.ts.map