/**
 * GameService 共用型別和常量
 *
 * 提供所有遊戲共用的事件名稱、Payload 介面和型別定義。
 */
import type { IBaseSpinResult } from "./IBaseSpinResult";
/**
 * 下注資訊
 */
export interface IBetInfo {
    betSize: number;
    betLevel: number;
    baseBet: number;
    betAmount: number;
    p1?: number;
}
/**
 * 基礎遊戲事件名稱（所有遊戲共用）
 *
 * 遊戲可展開此常量並加入遊戲特有事件。
 */
export declare const BASE_GAME_EVENTS: {
    readonly SPIN_START: "game:spin:start";
    readonly SPIN_RESULT: "game:spin:result";
    readonly SPIN_COMPLETE: "game:spin:complete";
    readonly LAST_SPIN_RESTORE: "game:last-spin:restore";
    readonly FREE_GAME_START: "game:free-game:start";
    readonly ANIMATION_COMPLETE: "game:animation:complete";
    readonly STOP_REEL_SPIN: "game:stop-reel-spin";
};
/** game:spin:start */
export interface ISpinStartPayload {
    betInfo: IBetInfo;
    timestamp: number;
    turboEnabled: boolean;
}
/** game:spin:result */
export interface ISpinResultPayload<TResult extends IBaseSpinResult = IBaseSpinResult> {
    result: TResult;
    timestamp: number;
}
/** game:spin:complete */
export interface ISpinCompletePayload {
    totalWinAmount: number;
    cascadeCount: number;
    timestamp: number;
}
/** game:last-spin:restore */
export interface ILastSpinRestorePayload<TResult extends IBaseSpinResult = IBaseSpinResult> {
    result: TResult;
    timestamp: number;
}
/** game:free-game:start */
export interface IFreeGameStartPayload {
    freeSpinCount: number;
    timestamp: number;
}
/** game:auto-spin:start */
export interface IAutoSpinStartPayload {
    count: number;
    betInfo: IBetInfo;
    timestamp: number;
}
/** game:auto-spin:progress */
export interface IAutoSpinProgressPayload {
    remaining: number;
    completed: number;
    totalCount: number;
    timestamp: number;
}
/** game:auto-spin:complete */
export interface IAutoSpinCompletePayload {
    totalSpins: number;
    totalWinAmount: number;
    timestamp: number;
}
/**
 * 檢查上次旋轉結果的回傳類型
 */
export interface ICheckLastSpinResult<TResult extends IBaseSpinResult = IBaseSpinResult> {
    /** 是否有未完成的旋轉 */
    hasUnfinishedSpin: boolean;
    /** 上次旋轉結果（如果有） */
    result?: TResult;
}
//# sourceMappingURL=GameServiceTypes.d.ts.map