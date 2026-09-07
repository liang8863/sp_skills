/**
 * Game Logic 類型定義
 *
 * 從 ExternalModules 導出通用遊戲服務邏輯的類型定義
 */

// ==================== Base Spin Result ====================
export type { IBaseSpinResult } from "../../../../../vendor/external-modules/1.0/gameLogic/IBaseSpinResult";

// ==================== Award ====================
export type { IAward } from "../../../../../vendor/external-modules/1.0/gameLogic/IAward";

// ==================== Base Game API ====================
export type { IBaseGameApi, IBaseSpinRequest, IBaseLastSpinRequest } from "../../../../../vendor/external-modules/1.0/gameLogic/IBaseGameApi";

// ==================== Base Game Service Logic ====================
export type { IBaseGameServiceLogic } from "../../../../../vendor/external-modules/1.0/gameLogic/IBaseGameServiceLogic";

// ==================== Game Service Hooks ====================
export type { IGameServiceHooks } from "../../../../../vendor/external-modules/1.0/gameLogic/IGameServiceHooks";

// ==================== Game Service Types ====================
export type {
    IBetInfo,
    ICheckLastSpinResult,
    ISpinStartPayload,
    ISpinResultPayload,
    ISpinCompletePayload,
    ILastSpinRestorePayload,
    IFreeGameStartPayload,
    IAutoSpinStartPayload,
    IAutoSpinProgressPayload,
    IAutoSpinCompletePayload,
} from "../../../../../vendor/external-modules/1.0/gameLogic/GameServiceTypes";
