import { GameActionType } from "../../types/GameActionTypes";
/**
 * 遊戲狀態枚舉
 *
 * 定義所有可能的遊戲狀態
 */
export declare const GAME_STATES: {
    /** 遊戲初始化中 - loading 期間，禁止任何動作 */
    readonly OPENING: "opening";
    /** 待機中 - 初始狀態，可以進行大部分操作 */
    readonly STANDBY: "standby";
    /** 開啟錢包 - 通過 HostBridge 開啟 Modal */
    readonly OPEN_BALANCE: "openBalance";
    /** 開啟設置下注 - 顯示 CustomBetPanelView */
    readonly OPEN_BET_PANEL: "openBetPanel";
    /** 開啟歷史頁面 - 通過 HostBridge 開啟 Modal */
    readonly OPEN_HISTORY: "openHistory";
    /** 開啟自動 spin 頁面 - 顯示 CustomAutoSpinPanelView */
    readonly OPEN_AUTO_SPIN: "openAutoSpin";
    /** 開啟選單 - 顯示 CustomMenuPanelView */
    readonly OPEN_MENU: "openMenu";
    /** 開啟賠率表 - 通過 HostBridge 開啟 Modal */
    readonly OPEN_PAYTABLE: "openPaytable";
    /** 開啟規則 - 通過 HostBridge 開啟 Modal */
    readonly OPEN_RULES: "openRules";
    /** 開始下注 - 點下 spin 通知 server 啟動遊戲 */
    readonly START_SPIN: "startSpin";
    /** slot 滾輪中 - 收到 response，滾輪還未停止 */
    readonly SPINNING: "spinning";
    /** 結算 - 顯示中獎結果 */
    readonly END_SPIN: "endSpin";
    /** 自動下注中 */
    readonly AUTO_SPINNING: "autoSpinning";
    /** FEATURE BUY遊戲內購介面 */
    readonly OPEN_FEATURE_BUY: "openFeatureBuy";
    /** 等待開始免費遊戲 - 顯示免費遊戲開場動畫，等待玩家點擊開始 */
    readonly WAIT_START_FREE_GAMING: "waitStartFreeGaming";
    /** 進入特殊中獎模式（Free Game） */
    readonly FREE_GAMING: "freeGaming";
};
/**
 * 遊戲狀態類型
 */
export type GameState = (typeof GAME_STATES)[keyof typeof GAME_STATES];
export type GAME_STATES_TYPE = typeof GAME_STATES;
/**
 * 狀態配置
 *
 * 定義每個狀態允許轉換到哪些狀態，以及允許執行哪些動作
 */
export interface StateConfig {
    /**
     * 狀態名稱
     */
    state: GameState;
    /**
     * 允許轉換到的目標狀態列表
     */
    allowedTransitions: GameState[];
    /**
     * 允許執行的動作列表
     *
     * 用於 GameAction 驗證
     */
    allowedActions: GameActionType[];
    /**
     * 是否記錄到歷史棧
     *
     * 某些臨時狀態（如 spinning）不需要記錄
     * 默認為 true
     */
    saveToHistory?: boolean;
    /**
     * 進入此狀態時的回調（可選）
     *
     * ⚠️ **使用限制**：
     * - 僅用於 Core 層的副作用（analytics、logging、core 數據更新）
     * - **禁止**用於 UI 控制（會違反分層原則，造成循環依賴）
     *
     * 📝 **正確用法**：
     * ```typescript
     * onEnter: (fromState) => {
     *   // ✅ 正確：追蹤分析事件
     *   analytics.trackEvent('state_entered', { state: 'spinning', fromState });
     *
     *   // ✅ 正確：記錄日誌
     *   logger.info(`[GameState] Entered ${this.state} from ${fromState}`);
     * }
     * ```
     *
     * ❌ **錯誤用法**：
     * ```typescript
     * onEnter: () => {
     *   // ❌ 錯誤：控制 UI（違反分層）
     *   gamePanelLogic.showMenuPanel();
     * }
     * ```
     *
     * 💡 **UI 控制請使用**：
     * 在 UI 層（GamePanelLogic）監聽 "gameState:changed" 事件
     */
    onEnter?: (fromState: GameState) => void;
    /**
     * 離開此狀態時的回調（可選）
     *
     * ⚠️ 使用限制同 onEnter
     */
    onExit?: (toState: GameState) => void;
}
/**
 * 狀態轉換結果
 */
export interface StateTransitionResult {
    /**
     * 是否成功
     */
    success: boolean;
    /**
     * 失敗原因（success 為 false 時提供）
     */
    reason?: string;
    /**
     * 轉換前的狀態
     */
    fromState?: GameState;
    /**
     * 轉換後的狀態
     */
    toState?: GameState;
}
/**
 * 狀態變化事件 Payload
 */
export interface StateChangedEvent {
    /**
     * 轉換前的狀態
     */
    fromState: GameState;
    /**
     * 轉換後的狀態
     */
    toState: GameState;
    /**
     * 變化時間戳
     */
    timestamp: number;
}
/**
 * 狀態轉換失敗事件 Payload
 */
export interface StateTransitionFailedEvent {
    /**
     * 當前狀態
     */
    currentState: GameState;
    /**
     * 目標狀態
     */
    targetState: GameState;
    /**
     * 失敗原因
     */
    reason: string;
    /**
     * 失敗時間戳
     */
    timestamp: number;
}
//# sourceMappingURL=GameStateTypes.d.ts.map