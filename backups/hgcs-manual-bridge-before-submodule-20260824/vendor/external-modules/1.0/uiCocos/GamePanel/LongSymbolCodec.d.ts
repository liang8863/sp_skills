import type { ILongSymbolDecoded } from "./ILongSymbolDecoded";
import type { ILongSymbolGroup } from "./ILongSymbolGroup";
/**
 * 長條圖標掩碼 Codec
 *
 * 編碼規範：value = extra*1000 + size*100 + symbolValue
 *
 * 純函式集合，不持有任何狀態。
 */
export declare const LongSymbolCodec: {
    /**
     * 解碼單一 value
     *
     * @example
     *   decode(7)   → { symbolId: 7, size: 1, frame: 0, isCovered: false, value: 7 }
     *   decode(303) → { symbolId: 3, size: 3, frame: 0, isCovered: false, value: 303 }
     *   decode(1207)→ { symbolId: 7, size: 2, frame: 1, isCovered: false, value: 1207 }
     *   decode(-1)  → { symbolId: -1, size: 0, frame: 0, isCovered: true, value: -1 }
     */
    decode(value: number): ILongSymbolDecoded;
    /** value === -1 判斷 */
    isCovered(value: number): boolean;
    /**
     * 從 layout 推導所有長條組
     *
     * 校驗規則：
     * - 第 0 格不能是 -1
     * - 連續 -1 數量必須等於 (size - 1)
     *
     * 校驗失敗時拋錯，呼叫端應在送進來前確保資料正確（後端已產生掩碼）。
     */
    buildGroupsFromLayout(layout: readonly number[]): ILongSymbolGroup[];
    /**
     * 從 layout 建立 idx → group 的快查表
     * （覆蓋格也會指向同一 group 物件，方便 logic / hook 用任一 idx 查到整組）
     */
    buildGroupMap(layout: readonly number[]): Map<number, ILongSymbolGroup>;
};
//# sourceMappingURL=LongSymbolCodec.d.ts.map