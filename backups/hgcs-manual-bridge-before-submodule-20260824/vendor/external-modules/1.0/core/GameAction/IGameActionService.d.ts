import { GameActionType, ActionResult, ActionState } from "../../types/GameActionTypes";
/**
 * 遊戲動作服務接口
 *
 * 統一管理所有遊戲動作（按鈕點擊等），提供狀態檢查、防連點、執行動作等功能
 */
export interface IGameActionService {
    /**
     * 檢查是否可以執行指定動作
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @param params - 動作參數（可選）
     * @returns 是否可以執行
     *
     * @example
     * ```ts
     * import { GAME_ACTION_TYPES } from '../../types/GameActionTypes';
     *
     * if (gameActionService.canPerformAction(GAME_ACTION_TYPES.SPIN)) {
     *   console.log('Can spin');
     * }
     * ```
     */
    canPerformAction(actionType: GameActionType, params?: unknown): boolean;
    /**
     * 執行指定動作
     *
     * 內建防連點和狀態檢查，自動處理鎖定和解鎖
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @param params - 動作參數（可選）
     * @returns 執行結果（Promise）
     *
     * @example
     * ```ts
     * import { GAME_ACTION_TYPES } from '../../types/GameActionTypes';
     *
     * const result = await gameActionService.performAction(GAME_ACTION_TYPES.SPIN);
     * if (!result.success) {
     *   console.error('Spin failed:', result.reason);
     * }
     * ```
     */
    performAction(actionType: GameActionType, params?: unknown): Promise<ActionResult>;
    /**
     * 獲取指定動作的當前狀態
     *
     * 用於 UI 更新（例如顯示按鈕是否可點擊、剩餘冷卻時間等）
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @returns 動作狀態
     *
     * @example
     * ```ts
     * import { GAME_ACTION_TYPES } from '../../types/GameActionTypes';
     *
     * const state = gameActionService.getActionState(GAME_ACTION_TYPES.SPIN);
     * console.log('Spin state:', {
     *   canExecute: state.canExecute,
     *   isLocked: state.isLocked,
     *   cooldown: state.cooldownRemaining,
     *   reason: state.reason,
     * });
     * ```
     */
    getActionState(actionType: GameActionType): ActionState;
    /**
     * 註冊動作執行器
     *
     * 允許遊戲層自定義動作的執行邏輯
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @param executor - 執行器函數
     *
     * @example
     * ```ts
     * import { GAME_ACTION_TYPES } from '../../types/GameActionTypes';
     *
     * gameActionService.registerActionExecutor(
     *   GAME_ACTION_TYPES.SPIN,
     *   async (params) => {
     *     // 自定義 Spin 邏輯
     *     const result = await apiService.spin(params);
     *     return { success: true, data: result };
     *   }
     * );
     * ```
     */
    registerActionExecutor(actionType: GameActionType, executor: (params?: unknown) => Promise<ActionResult>): void;
    /**
     * 註冊動作驗證器
     *
     * 允許遊戲層自定義動作的驗證邏輯（例如檢查遊戲狀態、餘額等）
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @param validator - 驗證器函數，返回 true 表示可執行，false 或錯誤訊息表示不可執行
     *
     * @example
     * ```ts
     * import { GAME_ACTION_TYPES } from '../../types/GameActionTypes';
     *
     * gameActionService.registerActionValidator(
     *   GAME_ACTION_TYPES.SPIN,
     *   (params) => {
     *     if (gameState.isSpinning) {
     *       return '遊戲進行中';
     *     }
     *     if (balance < betAmount) {
     *       return '餘額不足';
     *     }
     *     return true;
     *   }
     * );
     * ```
     */
    registerActionValidator(actionType: GameActionType, validator: (params?: unknown) => boolean | string): void;
}
//# sourceMappingURL=IGameActionService.d.ts.map