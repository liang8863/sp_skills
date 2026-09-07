/**
 * Game Logic 模組
 *
 * 提供通用的遊戲服務邏輯框架，
 * 使用 Composition + Hooks 模式讓各遊戲客製化行為。
 */
export type { IBaseSpinResult } from "./IBaseSpinResult";
export type { IBaseGameApi, IBaseSpinRequest, IBaseLastSpinRequest } from "./IBaseGameApi";
export type { IBaseGameServiceLogic } from "./IBaseGameServiceLogic";
export type { IGameServiceHooks } from "./IGameServiceHooks";
export type { IAward } from "./IAward";
export { BASE_GAME_EVENTS, type IBetInfo, type ICheckLastSpinResult, type ISpinStartPayload, type ISpinResultPayload, type ISpinCompletePayload, type ILastSpinRestorePayload, type IFreeGameStartPayload, type IAutoSpinStartPayload, type IAutoSpinProgressPayload, type IAutoSpinCompletePayload, } from "./GameServiceTypes";
export { BaseGameServiceLogic } from "./BaseGameServiceLogic";
//# sourceMappingURL=index.d.ts.map