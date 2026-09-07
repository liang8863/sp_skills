import type { Label, Node } from "cc";
import type { IAudioButtonView } from "../Common/IAudioButtonView";
/**
 * InfoBar View 接口
 *
 * 職責：提供玩家資訊欄 UI 元素訪問器
 */
export interface IInfoBarView {
    /**
     * 獲取根節點
     */
    getNode(): Node;
    /**
     * 獲取擁有籌碼 Label
     */
    getCoinsLabel(): Label | null;
    /**
     * 獲取下注金額 Label
     */
    getBetLabel(): Label | null;
    /**
     * 獲取贏得金額 Label
     */
    getWinLabel(): Label | null;
    /**
     * 獲取籌碼按鈕（點擊開啟錢包）
     * 返回 null 表示此場景不需要按鈕功能
     */
    getCoinsButton(): IAudioButtonView | null;
    /**
     * 獲取下注按鈕（點擊開啟 BetPanel）
     * 返回 null 表示此場景不需要按鈕功能
     */
    getBetButton(): IAudioButtonView | null;
    /**
     * 獲取贏得按鈕（點擊開啟歷史紀錄）
     * 返回 null 表示此場景不需要按鈕功能
     */
    getWinButton(): IAudioButtonView | null;
}
//# sourceMappingURL=IInfoBarView.d.ts.map