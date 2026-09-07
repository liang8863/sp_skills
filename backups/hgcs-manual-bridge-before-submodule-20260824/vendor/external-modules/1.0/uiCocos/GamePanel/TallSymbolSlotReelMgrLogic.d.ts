import { AbstractSlotReelMgrLogic } from "./AbstractSlotReelMgrLogic";
import type { ITallSymbolInfo } from "./ITallSymbolInfo";
/**
 * 長條圖標轉輪管理器
 *
 * 繼承 AbstractSlotReelMgrLogic，負責：
 * 1. 將長條圖標資料分發給各軸的 TallSymbolSlotReelLogic
 * 2. 消除時自動補齊長條整組的所有格位索引
 */
export declare class TallSymbolSlotReelMgrLogic extends AbstractSlotReelMgrLogic {
    /** 暫存各軸的長條圖標資料（供 scheduled callback 使用） */
    private tallSymbolDataList;
    /** 設定全體盤面（含長條資料） */
    setAllSymbol(symbolList: number[][], tallSymbolDataList?: ITallSymbolInfo[][]): void;
    /**
     * 設置轉輪結果（含長條資料）
     *
     * 需完整 override 因為 processReelResult 閉包中要傳遞 tallData
     */
    setSpinResult(iconsList: number[][], tallSymbolDataList?: ITallSymbolInfo[][]): void;
    /**
     * 消除表演
     *
     * 前處理：若 clearIndexList 包含長條圖標的任一格，自動補齊整組所有格
     */
    startClearShow(clearIndexList: number[][], changeSymbolClearIndexList: number[][], layout: number[][], isTurboMode: boolean): void;
    /**
     * 掉落表演（含長條資料）
     *
     * 需完整 override 因為要傳遞 tallData 給各軸的 startDropSequence
     */
    startDropShow(newResultList: number[][], isTurboMode: boolean, tallSymbolDataList?: ITallSymbolInfo[][]): void;
}
//# sourceMappingURL=TallSymbolSlotReelMgrLogic.d.ts.map