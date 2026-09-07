/**
 * 長條圖標資訊
 *
 * 後端提供的長條圖標資料結構，描述一個橫跨多格的圖標
 */
export interface ITallSymbolInfo {
    /** 合併的格位索引（軸內索引），如 [0, 1, 2] 表示橫跨 3 格 */
    idx: number[];
    /** 圖標值（後端符號代碼） */
    val: number;
    /** 框類型（由各遊戲自行解讀，如 0=無框, 1=銀框, 2=金框） */
    color: number;
}
//# sourceMappingURL=ITallSymbolInfo.d.ts.map