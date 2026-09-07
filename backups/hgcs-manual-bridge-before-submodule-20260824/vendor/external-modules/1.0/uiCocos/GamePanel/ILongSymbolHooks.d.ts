import type { ISlotReelHooks, ISlotReelContext } from "./ISlotReelHooks";
import type { ISlotReelSymbolView } from "./ISlotReelSymbolView";
import type { ILongSymbolDecoded } from "./ILongSymbolDecoded";
import type { ILongSymbolGroup } from "./ILongSymbolGroup";
/**
 * LongSymbol 專屬 hook context（在 ISlotReelContext 基礎上多帶 longGroupMap）
 */
export interface ILongSymbolContext extends ISlotReelContext {
    /** idx → group 的快查表（含 covered cells），由 layout 動態推導 */
    readonly longGroupMap?: ReadonlyMap<number, ILongSymbolGroup>;
}
/**
 * LongSymbol 專屬 hooks
 *
 * 繼承 ISlotReelHooks，去掉舊的 TallSymbol hooks，改用帶 decoded 的版本。
 */
export interface ILongSymbolHooks extends Omit<ISlotReelHooks, "onSetTallSymbolDisplay" | "onResetTallSymbol" | "updateRandTallIcon"> {
    /**
     * 設定長條圖標顯示（各遊戲實作視覺客製化）
     *
     * @param decoded   head 格的解碼結果（symbolId / size / frame 都在這）
     * @param position  'first' = 該 group 的第一格、'last' = 最後一格
     * @param groupSize 長條圖標橫跨的格數（= decoded.size）
     * @param isBlur    滾動中為 true，停輪後為 false
     * @returns true 表示已自行處理
     */
    onSetLongSymbolDisplay?(ctx: ILongSymbolContext, symbolView: ISlotReelSymbolView, decoded: ILongSymbolDecoded, position: "first" | "last", groupSize: number, isBlur?: boolean): boolean | void;
    /** 重置長條圖標節點（一般用於把 tallSymbolNode 關掉） */
    onResetLongSymbol?(ctx: ILongSymbolContext, symbolView: ISlotReelSymbolView): void;
    /**
     * 滾動中隨機顯示長條圖標
     *
     * 回傳 decoded 表示要產生一個長條（會自動延續 size-1 格 covered cells）；
     * 回傳 void 表示本次走普通隨機 icon。
     */
    updateRandLongSymbol?(ctx: ILongSymbolContext): ILongSymbolDecoded | void;
}
//# sourceMappingURL=ILongSymbolHooks.d.ts.map