/**
 * 事件名稱常量管理
 *
 * 按功能性分類，統一管理所有事件名稱
 */
/**
 * 玩家數據相關事件
 */
export declare const PLAYER_DATA_EVENTS: {
    /** 餘額變化 - payload: { oldBalance, newBalance, delta } */
    readonly BALANCE_CHANGED: "playerData:balanceChanged";
    /** 下注金額變化 - payload: { oldBetAmount, newBetAmount } */
    readonly BET_AMOUNT_CHANGED: "playerData:betAmountChanged";
    /** 下注邊界狀態變化 - payload: { isAtMin, isAtMax } */
    readonly BET_BOUNDS_CHANGED: "playerData:betBoundsChanged";
    /** Token 更新 - payload: { token } */
    readonly TOKEN_UPDATED: "playerData:tokenUpdated";
    /** 玩家數據載入完成 - payload: IPlayerData */
    readonly DATA_LOADED: "playerData:dataLoaded";
    /** 玩家數據清除 - payload: {} */
    readonly DATA_CLEARED: "playerData:dataCleared";
    /** 贏得金額更新 - payload: number (由遊戲邏輯層發送，非 PlayerDataManager) */
    readonly UPDATE_WIN: "playerData:updateWin";
};
/**
 * 玩家數據事件類型
 */
export type PLAYER_DATA_EVENTS_TYPE = typeof PLAYER_DATA_EVENTS;
/**
 * 遊戲流程相關事件
 */
export declare const GAME_FLOW_EVENTS: {
    readonly START: "gameFlow:start";
    readonly SPIN: "gameFlow:spin";
    readonly SPIN_END: "gameFlow:spinEnd";
    readonly RESULT: "gameFlow:result";
    readonly END: "gameFlow:end";
    /**
     * Spin 結果接收（允許跳過動畫）
     * payload: SpinResult
     */
    readonly SPIN_RESULT: "game:spin:result";
    /**
     * 停止轉輪（用戶點擊停止按鈕）
     * payload: 無
     */
    readonly STOP_REEL_SPIN: "game:stop-reel-spin";
};
/**
 * 遊戲狀態相關事件
 */
export declare const GAME_STATE_EVENTS: {
    /**
     * 狀態變化
     * payload: StateChangedEvent { fromState, toState, timestamp }
     */
    readonly CHANGED: "gameState:changed";
    /**
     * 狀態轉換失敗
     * payload: StateTransitionFailedEvent { currentState, targetState, reason, timestamp }
     */
    readonly TRANSITION_FAILED: "gameState:transitionFailed";
    /**
     * 狀態機重置
     * payload: { timestamp }
     */
    readonly RESET: "gameState:reset";
    /**
     * 狀態歷史清空
     * payload: { timestamp }
     */
    readonly HISTORY_CLEARED: "gameState:historyCleared";
};
/**
 * 遊戲狀態事件類型
 */
export type GAME_STATE_EVENTS_TYPE = typeof GAME_STATE_EVENTS;
/**
 * Turbo 模式相關事件
 */
export declare const TURBO_EVENTS: {
    /**
     * Turbo 狀態變化（統一事件）
     * payload: { enabled: boolean }
     *
     * @example
     * // 監聽 Turbo 狀態變化
     * eventSystem.on("turbo:changed", (data) => {
     *   if (data.enabled) {
     *     // Turbo 開啟
     *     this.setSpinDuration(1000);
     *   } else {
     *     // Turbo 關閉
     *     this.setSpinDuration(2000);
     *   }
     * });
     */
    readonly CHANGED: "turbo:changed";
};
/**
 * Turbo 事件類型
 */
export type TURBO_EVENTS_TYPE = typeof TURBO_EVENTS;
/**
 * 自動旋轉相關事件
 */
export declare const AUTO_SPIN_EVENTS: {
    /**
     * 自動旋轉開始
     * payload: { count: number, betInfo: BetInfo, timestamp: number }
     */
    readonly START: "game:auto-spin:start";
    /**
     * 自動旋轉進度更新
     * payload: { remaining: number, completed: number, totalCount: number, timestamp: number }
     */
    readonly PROGRESS: "game:auto-spin:progress";
    /**
     * 停止自動旋轉（由 UI 發送，通知 GameService 將剩餘次數歸 0）
     * payload: 無
     */
    readonly STOP: "game:auto-spin:stop";
    /**
     * 自動旋轉完成
     * payload: { totalSpins: number, totalWinAmount: number, timestamp: number }
     */
    readonly COMPLETE: "game:auto-spin:complete";
};
/**
 * 自動旋轉事件類型
 */
export type AUTO_SPIN_EVENTS_TYPE = typeof AUTO_SPIN_EVENTS;
/**
 * Loading 相關事件
 */
export declare const LOADING_EVENTS: {
    /**
     * Loading 关闭按钮被点击（玩家手动关闭 loading 画面）
     * 由 AbstractLoadingViewLogic.onCloseButtonClick 广播
     * 上层（如 ServiceBridge）可监听以接管「自动 markGameReady」等鏈路
     * payload: 無
     */
    readonly CLOSED: "loading:closed";
};
/**
 * Loading 事件類型
 */
export type LOADING_EVENTS_TYPE = typeof LOADING_EVENTS;
//# sourceMappingURL=Events.d.ts.map