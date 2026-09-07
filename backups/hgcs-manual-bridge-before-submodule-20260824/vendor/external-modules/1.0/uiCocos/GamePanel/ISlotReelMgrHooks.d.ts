import type { Vec3 } from "cc";
import type { ISlotReelMgrView } from "./ISlotReelMgrView";
import type { AbstractSlotReelLogic } from "./AbstractSlotReelLogic";
/**
 * SlotReelMgr Hook 的上下文物件
 *
 * 提供 hook 函式存取管理器內部狀態與方法的能力
 */
export interface ISlotReelMgrContext {
    readonly isTurbo: boolean;
    /** 玩家是否在本輪手動點擊 SPIN 強制停輪（startSpin 時重置為 false） */
    readonly isManualStop: boolean;
    readonly startPeekingIndex: number;
    readonly nowScatterCount: number;
    readonly reelLogicList: AbstractSlotReelLogic[];
    readonly view: ISlotReelMgrView;
    readonly maskDefultPos: Vec3;
    /** 還原轉軸層級 */
    adjustReelSorting(): void;
}
/**
 * SlotReelMgr Hooks 介面
 *
 * 遊戲端透過傳入 hooks 物件來客製化轉輪管理器行為
 */
export interface ISlotReelMgrHooks {
    /** 覆寫 Scatter 計數邏輯；回傳數字表示使用該值，void 表示走預設 */
    checkScatterCount?(ctx: ISlotReelMgrContext, reelIndex: number, currentIcons: number[]): number | void;
    /** */
    onAfterSetSpinResult?(ctx: ISlotReelMgrContext, iconsList: number[][]): void;
    onAfterSetSingleReelSpinResult?(ctx: ISlotReelMgrContext, iconsList: number[]): void;
    /** spinCallBack 完成後呼叫（含 allSpinOver 判斷之後） */
    onAfterSpinCallBack?(ctx: ISlotReelMgrContext, index: number): void;
    /** allSpinOver 完成後呼叫 */
    onAfterAllSpinOver?(ctx: ISlotReelMgrContext): void;
    /** startClearShow 完成後呼叫 */
    onAfterStartClearShow?(ctx: ISlotReelMgrContext, clearIndexList: number[][], changeSymbolClearIndexList: number[][], layout: number[][], isTurboMode: boolean): void;
    /** startDropShow 開頭呼叫 */
    onBeforeStartDropShow?(ctx: ISlotReelMgrContext, newResultList: number[][], isTurboMode: boolean): void;
}
//# sourceMappingURL=ISlotReelMgrHooks.d.ts.map