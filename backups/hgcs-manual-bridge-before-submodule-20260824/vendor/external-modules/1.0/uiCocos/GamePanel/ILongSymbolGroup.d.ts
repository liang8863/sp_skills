import type { ILongSymbolDecoded } from "./ILongSymbolDecoded";
/**
 * 從 layout 推導出的長條圖標組
 *
 * 例如 layout `[7, 303, -1, -1, 1]` 會推出三組：
 * - { idx: [0],     head: decoded(7,   size=1) }
 * - { idx: [1,2,3], head: decoded(303, size=3) }
 * - { idx: [4],     head: decoded(1,   size=1) }
 */
export interface ILongSymbolGroup {
    /** 該組覆蓋的軸內格位索引（含 head 與 covered cells） */
    idx: number[];
    /** head 格的解碼結果（symbolId / size / frame 都在這） */
    head: ILongSymbolDecoded;
}
//# sourceMappingURL=ILongSymbolGroup.d.ts.map