import { GameState, StateConfig, StateTransitionResult } from "./GameStateTypes";
import { GameActionType } from "../../types/GameActionTypes";
/**
 * 遊戲狀態管理器接口
 *
 * 統一管理遊戲狀態流轉、驗證和歷史記錄
 */
export interface IGameStateManager {
    /**
     * 獲取當前狀態
     *
     * @returns 當前遊戲狀態
     *
     * @example
     * ```ts
     * const currentState = stateManager.getCurrentState();
     * console.log('Current state:', currentState);
     * ```
     */
    getCurrentState(): GameState;
    /**
     * 獲取上一個狀態
     *
     * @returns 上一個遊戲狀態，如果沒有則返回 null
     */
    getPreviousState(): GameState | null;
    /**
     * 切換到目標狀態
     *
     * 會自動驗證是否可以切換，並記錄到歷史棧
     *
     * @param targetState - 目標狀態
     * @param skipValidation - 是否跳過驗證（僅用於特殊情況，如錯誤恢復）
     * @param skipHistory - 是否跳過歷史記錄（goBack 時應傳 true，避免歷史棧被污染）
     * @returns 切換結果
     *
     * @example
     * ```ts
     * const result = stateManager.changeState('openMenu');
     * if (!result.success) {
     *   console.error('Cannot open menu:', result.reason);
     * }
     * ```
     */
    changeState(targetState: GameState, skipValidation?: boolean, skipHistory?: boolean): StateTransitionResult;
    /**
     * 檢查是否可以切換到目標狀態
     *
     * @param targetState - 目標狀態
     * @returns 是否可以切換
     *
     * @example
     * ```ts
     * if (stateManager.canTransitionTo('openMenu')) {
     *   // 允許切換
     * }
     * ```
     */
    canTransitionTo(targetState: GameState): boolean;
    /**
     * 檢查當前狀態下是否可以執行指定動作
     *
     * 用於 GameAction 的 validator 集成
     *
     * @param actionType - 動作類型（GAME_ACTION_TYPES）
     * @returns 是否可以執行（true 或錯誤訊息字串）
     *
     * @example
     * ```ts
     * const canSpin = stateManager.canPerformAction(GAME_ACTION_TYPES.SPIN);
     * if (canSpin !== true) {
     *   console.log('Cannot spin:', canSpin);
     * }
     * ```
     */
    canPerformAction(actionType: GameActionType): boolean | string;
    /**
     * 返回上一個狀態
     *
     * 使用歷史棧自動回到上一個狀態
     *
     * @returns 切換結果
     *
     * @example
     * ```ts
     * // 從 openHistory 返回到 standby
     * stateManager.goBack();
     * ```
     */
    goBack(): StateTransitionResult;
    /**
     * 獲取狀態歷史棧
     *
     * @returns 狀態歷史數組（不可變）
     */
    getStateHistory(): ReadonlyArray<GameState>;
    /**
     * 清空狀態歷史棧
     *
     * 通常用於遊戲重置或特殊場景
     */
    clearHistory(): void;
    /**
     * 重置狀態機到初始狀態
     *
     * 清空歷史棧並回到 standby
     *
     * @example
     * ```ts
     * // 遊戲發生錯誤時重置
     * stateManager.reset();
     * ```
     */
    reset(): void;
    /**
     * 獲取狀態轉換配置（用於調試）
     *
     * @param state - 狀態名稱
     * @returns 狀態配置，如果不存在則返回 null
     */
    getStateConfig(state: GameState): StateConfig | null;
}
//# sourceMappingURL=IGameStateManager.d.ts.map