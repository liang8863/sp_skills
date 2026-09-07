import { StateConfig } from "./GameStateTypes";
/**
 * 狀態轉換配置
 *
 * ## 架構設計決策：事件驅動的 UI 控制
 *
 * ### 職責劃分
 *
 * 本配置文件定義：
 * - ✅ 狀態轉換規則（allowedTransitions）
 * - ✅ 允許的動作（allowedActions）
 * - ✅ Core 層的副作用（onEnter/onExit - 可選）
 *
 * 本配置文件**不**定義：
 * - ❌ UI 顯示/隱藏邏輯
 * - ❌ UI 組件的啟用/禁用
 * - ❌ UI 動畫和視覺效果
 *
 * ### UI 控制的正確方式
 *
 * 所有 UI 相關的邏輯應該在 **UI 層**處理：
 *
 * ```typescript
 * // ✅ 正確：在 GamePanelLogic 中監聽事件
 * export class GamePanelLogic {
 *   public initialize(): void {
 *     eventSystem.on("gameState:changed", this.onGameStateChanged, this);
 *   }
 *
 *   protected onGameStateChanged(event: StateChangedEvent): void {
 *     switch (event.toState) {
 *       case GAME_STATES.OPEN_MENU:
 *         this.controlPanelLogic?.hide();
 *         this.menuPanelLogic?.show();
 *         break;
 *       // ...
 *     }
 *   }
 * }
 * ```
 *
 * ### onEnter/onExit 的正確用途
 *
 * 僅用於 Core 層的副作用：
 *
 * ```typescript
 * [GAME_STATES.SPINNING]: {
 *   state: GAME_STATES.SPINNING,
 *   allowedTransitions: [GAME_STATES.END_SPIN],
 *   allowedActions: [GAME_ACTION_TYPES.IMMEDIATE_STOP],
 *
 *   // ✅ 正確：追蹤分析（Core 關注點）
 *   onEnter: (fromState) => {
 *     const analytics = getService(SERVICE_IDENTIFIERS.ANALYTICS);
 *     analytics.trackSpinStart({ fromState });
 *   },
 * }
 * ```
 *
 * ### 為什麼這樣設計？
 *
 * 1. **分層清晰**：Core 層不依賴 UI 層，避免循環依賴
 * 2. **易於維護**：UI 邏輯集中在一處，容易查找和修改
 * 3. **易於擴展**：遊戲可以繼承 GamePanelLogic 自定義 UI 行為
 * 4. **可測試性**：Core 邏輯可以獨立於 UI 進行測試
 *
 * 配置原則：
 * 1. allowedTransitions：定義可以轉換到哪些狀態
 * 2. allowedActions：定義可以執行哪些 GameAction
 * 3. saveToHistory：是否需要記錄到歷史棧（默認 true）
 */
export declare const STATE_TRANSITION_CONFIG: Record<string, StateConfig>;
/**
 * GameAction → GameState 映射表
 *
 * 定義哪些 GameAction 會自動觸發狀態轉換
 *
 * 格式：{ actionType: targetState }
 */
export declare const ACTION_TO_STATE_MAP: Partial<Record<string, string>>;
//# sourceMappingURL=GameStateConfig.d.ts.map