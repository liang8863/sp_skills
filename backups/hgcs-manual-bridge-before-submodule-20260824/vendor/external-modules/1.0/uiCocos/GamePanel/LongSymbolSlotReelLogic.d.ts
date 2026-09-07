import { AbstractSlotReelLogic, IconMappingResult } from "./AbstractSlotReelLogic";
import type { ISlotReelView } from "./ISlotReelView";
import type { ISlotReelSymbolView } from "./ISlotReelSymbolView";
import type { ILogger } from "../../core/Logger/ILogger";
import type { ILongSymbolHooks, ILongSymbolContext } from "./ILongSymbolHooks";
import type { ILongSymbolGroup } from "./ILongSymbolGroup";
import type { ILongSymbolDecoded } from "./ILongSymbolDecoded";
/**
 * 長條圖標轉輪邏輯（掩碼版）
 *
 * 與舊 TallSymbolSlotReelLogic 的差異：
 * - 不接受外部送 tallSymbols 結構，所有資訊從 layout 掩碼解碼
 * - covered cell 由 layout 中的 -1 表示，不再用 idx[] 陣列
 * - hook 拿到的是 ILongSymbolDecoded（symbolId / size / frame）
 *
 * 沿用「首尾開啟」策略：長條組的第一格和最後一格各顯示長條節點，
 * 透過偏移防止滾動時露出間隙。
 */
export declare class LongSymbolSlotReelLogic extends AbstractSlotReelLogic {
    /** idx → group 的快查表（含 covered cells） */
    protected longGroupMap: Map<number, ILongSymbolGroup>;
    /** 滾動中長條圖標剩餘 continuation 格數 */
    protected longSpinRemaining: number;
    /** 滾動中長條的暫存 head decoded（供最後一格開 "first" 用） */
    protected longSpinPending: ILongSymbolDecoded | null;
    /**
     * 保留原始 long hooks。Base constructor 只複製它認識的 key，
     * 新的 onSetLongSymbolDisplay 等會在那一步遺失，所以這裡自己存一份。
     */
    protected longHooks: ILongSymbolHooks;
    constructor(view: ISlotReelView, logger: ILogger, hooks?: ILongSymbolHooks);
    /** 取得 idx → group 快查表（供 MgrLogic 使用） */
    getLongGroupMap(): ReadonlyMap<number, ILongSymbolGroup>;
    /** 取得某 idx 所屬的 group（含覆蓋格） */
    getLongGroupAt(idx: number): ILongSymbolGroup | undefined;
    reset(): void;
    setSpinResult(result: number[]): void;
    setAllSymbol(resultList: number[], isInitial?: boolean): void;
    startDropSequence(newResultList: number[], onComplete?: (reelIndex: number) => void, isPeeking?: boolean, peekingReelOffset?: number): void;
    /**
     * 將掩碼 value 解碼成 iconIndex（symbolId）；hook 若有提供則優先用 hook。
     */
    protected getIconAndBgIndex(value: number): IconMappingResult;
    protected updateIcon(iconIndex: number, bgIndex?: number, openSpIcon?: boolean): void;
    protected updateRandIcon(): void;
    /**
     * 判斷剩餘 SPINING 時間能否塞下 size 格的長條（head + size-1 continuations）。
     * 詳細解釋見 TallSymbolSlotReelLogic.canFitRandomTallSize。
     */
    protected canFitRandomLongSize(size: number): boolean;
    protected update(dt: number): void;
    protected stopAni(): void;
    protected buildContext(): ILongSymbolContext;
    /** 從 layout 重建 idx → group 快查表（buildGroupsFromLayout 內含校驗） */
    protected rebuildGroupMap(layout: readonly number[]): void;
    /**
     * 設定長條圖標顯示
     *
     * 隱藏正常 icon、啟用 tallSymbolNode 並偏移到組中心，最後委託 hook 處理視覺。
     */
    protected setLongSymbolDisplay(symbolView: ISlotReelSymbolView, decoded: ILongSymbolDecoded, position: "first" | "last", isBlur?: boolean): void;
    /** 重置長條圖標節點（關閉 longNode 並通知 hook） */
    protected resetLongSymbol(symbolView: ISlotReelSymbolView): void;
    /** 隱藏中間 covered cell 的視覺（icon/bg/long node 都關閉） */
    protected hideMiddleSymbol(symbolView: ISlotReelSymbolView): void;
    /** Long-only hook 介面，但內部仍存在 base 的 hooks 物件上 */
    protected getHooks(): Required<ILongSymbolHooks> & {
        getIconAndBgIndex: any;
    };
}
//# sourceMappingURL=LongSymbolSlotReelLogic.d.ts.map