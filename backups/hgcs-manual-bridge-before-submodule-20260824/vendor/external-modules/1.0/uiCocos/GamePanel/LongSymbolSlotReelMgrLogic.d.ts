import { AbstractSlotReelMgrLogic } from "./AbstractSlotReelMgrLogic";
/**
 * 長條圖標轉輪管理器（掩碼版）
 *
 * 與舊 TallSymbolSlotReelMgrLogic 的差異：
 * - 不再有 tallSymbolDataList 第二參數，所有資訊從 layout 自身解碼
 * - startClearShow 補齊整組消除，透過 reel 的 longGroupMap 推導
 * - checkScatterCount 自動先解碼 value 再比對 scatterID
 */
export declare class LongSymbolSlotReelMgrLogic extends AbstractSlotReelMgrLogic {
    /**
     * 消除表演：若 clearIndexList 包含長條圖標的任一格，自動補齊整組所有格。
     */
    startClearShow(clearIndexList: number[][], changeSymbolClearIndexList: number[][], layout: number[][], isTurboMode: boolean): void;
    /**
     * Scatter 計數：先把每個 value 解碼成 symbolId 再與 scatterID 比對。
     * 子類可以覆寫，或在 hooks.checkScatterCount 自訂。
     */
    protected checkScatterCount(reelIndex: number, currentIcons: number[]): number;
}
//# sourceMappingURL=LongSymbolSlotReelMgrLogic.d.ts.map