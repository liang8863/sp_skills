/**
 * GameAction 輔助工具
 *
 * 提供簡化的 API 給 Cocos 層使用，避免直接操作 DI Container
 */
import { GameActionType, ActionResult, ActionState } from "../../types/GameActionTypes";
/**
 * GameAction 輔助類
 *
 * 提供靜態方法，方便在 Cocos 層直接使用
 *
 * @example
 * ```ts
 * import { GameActionHelper, GAME_ACTION_TYPES } from 'external-modules';
 *
 * // 執行動作
 * const result = await GameActionHelper.performAction(GAME_ACTION_TYPES.SPIN);
 *
 * // 檢查是否可執行
 * if (GameActionHelper.canPerformAction(GAME_ACTION_TYPES.SPIN)) {
 *   console.log('Can spin');
 * }
 *
 * // 獲取動作狀態
 * const state = GameActionHelper.getActionState(GAME_ACTION_TYPES.SPIN);
 * ```
 */
export declare class GameActionHelper {
    /**
     * 獲取 GameActionService 實例
     *
     * @private
     */
    private static getGameActionService;
    /**
     * 獲取 InteractionLockManager 實例
     *
     * @private
     */
    private static getInteractionLockManager;
    /**
     * 檢查是否可以執行指定動作
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @param params - 動作參數（可選）
     * @returns 是否可以執行
     */
    static canPerformAction(actionType: GameActionType, params?: unknown): boolean;
    /**
     * 執行指定動作
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @param params - 動作參數（可選）
     * @returns 執行結果（Promise）
     */
    static performAction(actionType: GameActionType, params?: unknown): Promise<ActionResult>;
    /**
     * 獲取指定動作的當前狀態
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @returns 動作狀態
     */
    static getActionState(actionType: GameActionType): ActionState;
    /**
     * 註冊動作執行器
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @param executor - 執行器函數
     */
    static registerActionExecutor(actionType: GameActionType, executor: (params?: unknown) => Promise<ActionResult>): void;
    /**
     * 註冊動作驗證器
     *
     * @param actionType - 動作類型（使用 GAME_ACTION_TYPES 常量）
     * @param validator - 驗證器函數
     */
    static registerActionValidator(actionType: GameActionType, validator: (params?: unknown) => boolean | string): void;
    /**
     * 鎖定全局
     *
     * 鎖定後，所有動作都無法執行
     */
    static lockGlobal(): void;
    /**
     * 解鎖全局
     */
    static unlockGlobal(): void;
    /**
     * 檢查全局是否被鎖定
     */
    static isGlobalLocked(): boolean;
    /**
     * 清除所有鎖
     *
     * 通常用於遊戲重置或錯誤恢復
     */
    static clearAllLocks(): void;
}
//# sourceMappingURL=GameActionHelper.d.ts.map