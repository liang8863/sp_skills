import type { Node, Sprite, Label, Color } from "cc";
import type { sp } from "cc";
import type { IAudioButtonView } from "../Common/IAudioButtonView";
/**
 * ControlPanel View 接口
 *
 * 職責：提供遊戲控制按鈕 UI 元素訪問器
 */
export interface IControlPanelView {
    /**
     * 獲取根節點
     */
    getNode(): Node;
    /**
     * 獲取 TURBO 按鈕
     */
    getTurboButton(): IAudioButtonView | null;
    /**
     * 獲取 TURBO 開啟狀態的 Sprite
     */
    getTurboOnSprite(): Sprite | null;
    /**
     * 獲取 TURBO 關閉狀態的 Sprite
     */
    getTurboOffSprite(): Sprite | null;
    /**
     * 獲取減少下注按鈕
     */
    getBetMinusButton(): IAudioButtonView | null;
    /**
     * 獲取增加下注按鈕
     */
    getBetPlusButton(): IAudioButtonView | null;
    /**
     * 獲取 SPIN 按鈕
     */
    getSpinButton(): IAudioButtonView | null;
    /**
     * 獲取 AUTO 按鈕
     */
    getAutoButton(): IAudioButtonView | null;
    /**
     * 獲取 MENU 按鈕
     */
    getMenuButton(): IAudioButtonView | null;
    /**
     * 獲取自動旋轉停止按鈕
     */
    getAutoSpinStopButton(): IAudioButtonView | null;
    /**
     * 獲取自動旋轉次數顯示文本
     */
    getAutoSpinCountLabel(): Label | null;
    /**
     * 獲取音效關閉圖示節點
     */
    getAudioOffIcon(): Node | null;
    /**
     * 獲取預設顏色
     */
    getDefultColor(): Color;
    /**
     * 獲取 TURBO 特效 Spine 動畫（可選）
     */
    getTurboSpine?(): sp.Skeleton | null;
    /**
     * 獲取選單內容節點（可選）
     *
     * 有回傳節點時，show/hide 動畫改以此節點為對象，並額外對 Spin 按鈕做淡入/淡出。
     */
    getMenuContent?(): Node | null;
}
//# sourceMappingURL=IControlPanelView.d.ts.map