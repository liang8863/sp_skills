/**
 * 長條圖標掩碼解碼結果
 *
 * 後端 layout value 採用十進位掩碼編碼：
 *   value = extra*1000 + size*100 + symbolValue
 *
 * - 個十位 (value % 100)       → symbolId
 * - 百位   ((value % 1000)/100) → size（0/1 都正規化成 1）
 * - 千位+  (value / 1000)        → frame（框類型，遊戲自訂語意）
 * - value === -1                → covered cell（被前一個長 symbol 蓋住）
 */
export interface ILongSymbolDecoded {
    /** 原始 value（含掩碼），方便 hook 內做額外判斷 */
    value: number;
    /** 符號 ID（個十位） */
    symbolId: number;
    /** 佔用格數（百位正規化後，最小為 1） */
    size: number;
    /** 框類型（千位+，遊戲自訂；例：0=無, 1=銀, 2=金） */
    frame: number;
    /** 是否為被覆蓋的格子（value === -1） */
    isCovered: boolean;
}
//# sourceMappingURL=ILongSymbolDecoded.d.ts.map