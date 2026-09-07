import type { Label, Node } from "cc";
import type { IDiscretePickerView } from "../Common/IDiscretePickerView";
import type { IAudioButtonView } from "../Common/IAudioButtonView";
import type { IInfoBarView } from "./IInfoBarView";
/**
 * BetPanel View 接口
 *
 * 職責：提供下注資訊面板 UI 元素訪問器
 */
export interface IBetPanelView {
    /**
     * 獲取根節點
     */
    getNode(): Node;
    /**
     * 獲取投注大小選擇器 (Bet Size Picker)
     */
    getBetSizePicker(): IDiscretePickerView | null;
    /**
     * 獲取投注等級選擇器 (Bet Level Picker)
     */
    getBetLevelPicker(): IDiscretePickerView | null;
    /**
     * 獲取基礎投注選擇器 (Base Bet Picker，通常只有一個選項)
     */
    getBaseBetPicker(): IDiscretePickerView | null;
    /**
     * 獲取投注金額選擇器 (Bet Amount Picker)
     */
    getBetAmountPicker(): IDiscretePickerView | null;
    /**
     * 獲取 InfoBar 組件（顯示餘額、下注、贏分）
     */
    getInfoBar(): IInfoBarView | null;
    /**
     * 獲取最大投注按鈕
     */
    getMaxBetButton(): IAudioButtonView | null;
    /**
     * 獲取最大投注按鈕的標題 Label（用於按鈕禁能時同步調整透明度）
     * 可選實作，不提供則 BetPanelLogic 不會動到 Label
     */
    getMaxBetButtonLabel?(): Label | null;
    /**
     * 獲取確定按鈕
     */
    getConfirmButton(): IAudioButtonView | null;
    /**
     * 獲取關閉按鈕
     */
    getCloseButton(): IAudioButtonView | null;
    /**
     * 獲取遮罩按鈕（點擊背景關閉面板）
     */
    getMaskButton(): IAudioButtonView | null;
    /**
     * 獲取內容背景節點（用於動畫滑入滑出）
     */
    getContentBackground(): Node | null;
    /**
     * 獲取內容節點（包含所有面板內容）
     */
    getContent(): Node | null;
}
//# sourceMappingURL=IBetPanelView.d.ts.map