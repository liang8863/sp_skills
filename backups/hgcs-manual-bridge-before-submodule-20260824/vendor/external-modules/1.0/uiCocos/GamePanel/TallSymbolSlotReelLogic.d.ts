import { AbstractSlotReelLogic } from "./AbstractSlotReelLogic";
import type { ISlotReelSymbolView } from "./ISlotReelSymbolView";
import type { ITallSymbolInfo } from "./ITallSymbolInfo";
import type { ISlotReelContext } from "./ISlotReelHooks";
/**
 * 長條圖標轉輪邏輯
 *
 * 繼承 AbstractSlotReelLogic，新增長條圖標（Tall Symbol）的顯示、滾動、消除支援。
 * 長條圖標橫跨多格，採用「首尾開啟」策略：在合併組的第一格和最後一格各顯示長條節點，
 * 透過 Y 偏移防止滾動/彈跳時露出間隙。
 */
export declare class TallSymbolSlotReelLogic extends AbstractSlotReelLogic {
    /** 長條圖標資訊列表（來自後端） */
    protected tallSymbolInfoList: ITallSymbolInfo[];
    /** 位置索引 → 長條圖標資訊的快查表 */
    protected tallSymbolMap: Map<number, ITallSymbolInfo>;
    /** 滾動中長條圖標剩餘 continuation 格數 */
    protected tallSpinRemaining: number;
    /** 滾動中長條的暫存資訊（供 continuation 最後一格開 "first" 用） */
    protected tallSpinInfo: {
        tallInfo: ITallSymbolInfo;
        size: number;
    } | null;
    /** 取得長條圖標映射表（供 MgrLogic 使用） */
    getTallSymbolMap(): ReadonlyMap<number, ITallSymbolInfo>;
    reset(): void;
    setSpinResult(result: number[], tallInfoList?: ITallSymbolInfo[]): void;
    setAllSymbol(resultList: number[], isInitial?: boolean, tallInfoList?: ITallSymbolInfo[]): void;
    startDropSequence(newResultList: number[], onComplete?: (reelIndex: number) => void, isPeeking?: boolean, peekingReelOffset?: number, tallInfoList?: ITallSymbolInfo[]): void;
    protected updateIcon(iconIndex: number, bgIndex?: number, openSpIcon?: boolean): void;
    protected updateRandIcon(): void;
    /**
     * 判斷剩餘 SPINING 時間能否塞下 size 格的長條（head + size-1 continuations）。
     *
     * 一個 size=N 的隨機長條，head 放在這個 tick；剩下 N-1 格 continuation 必須在 STOP 開始
     * 前由後續 updateRandIcon 補上，否則 STOP 會用 result 填那些 cell、但 head 的 tall sprite
     * 仍然往上延伸 N-1 格，覆蓋到要顯示的正確結果圖標。
     *
     * tick 間隔 ≈ iconSpace / nowSpeed；SPINING 剩餘時間 = spinTime - spinTimer。
     * 加一格安全 buffer，避免邊界踩線（spinTimer 剛好 >= spinTime 就會切 STOP）。
     */
    protected canFitRandomTallSize(size: number): boolean;
    protected update(dt: number): void;
    protected stopAni(): void;
    /** 從 tallSymbolInfoList 建構快查表 */
    protected buildTallSymbolMap(): void;
    /**
     * 設定長條圖標顯示
     *
     * 隱藏正常 icon，啟用 tallSymbolNode 並計算 Y 偏移，
     * 委託 hook 處理遊戲特定的視覺設定（圖片、框樣式）
     */
    protected setTallSymbolDisplay(symbolView: ISlotReelSymbolView, tallInfo: ITallSymbolInfo, position: "first" | "last", groupSize: number, isBlur?: boolean): void;
    /** 重置長條圖標節點 */
    protected resetTallSymbol(symbolView: ISlotReelSymbolView): void;
    /** Override：所有 hook 都能拿到 tallSymbolMap */
    protected buildContext(): ISlotReelContext;
}
//# sourceMappingURL=TallSymbolSlotReelLogic.d.ts.map