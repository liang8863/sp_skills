/**
 * 通用 Spin 結果介面
 *
 * BaseGameServiceLogic 實際讀取的最小欄位集。
 * 各遊戲的 ISpinResultCamel 應 extends 此介面。
 */
export interface IBaseSpinResult {
    /** 本輪遊戲是否已完全結束（含 free game） */
    isFinished: boolean;
    /** 是否為新的 spin（非連消） */
    isNewSpin: boolean;
    /** 本次 spin 是否結束（連消判斷） */
    isSpinFinished: boolean;
    /** 是否免費遊戲 */
    isFree: boolean;
    /** 免費遊戲剩餘次數 */
    spinChance: number;
    /** 本次 spin 派彩金額 */
    spinWinAmount: string;
    /** 錢包餘額 */
    balance: string;
    /** FG 累計贏分（base service 用來在 SPIN_START 時保留顯示，避免歸零跳動） */
    spinWinSum?: string;
}
//# sourceMappingURL=IBaseSpinResult.d.ts.map