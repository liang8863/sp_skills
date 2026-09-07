/**
 * GameService Hooks 介面
 *
 * 遊戲透過 hooks 客製化 BaseGameServiceLogic 的行為。
 * 所有方法皆為可選（有預設值），僅需覆寫需要客製化的部分。
 */
import type { IBaseSpinResult } from "./IBaseSpinResult";
export interface IGameServiceHooks<TResult extends IBaseSpinResult = IBaseSpinResult> {
    /** 遊戲代碼（必填，用於 API 請求） */
    gameCode: string;
    /**
     * 是否启用自动金额更新流程（默认 false，保持旧行为不变）。
     *
     * 开启后 BaseGameServiceLogic 会自动驱动 PlayerDataManager 余额：
     * 1. spin/featureBuy 拿到新 spin 结果（isNewSpin 且非 FG 模式中）时，
     *    余额显示为 `balance - spinWinSum`（即扣注后金额）；
     * 2. handleSpinComplete 结算时，余额更新为 server 回传的最终 `balance`；
     * 3. checkLastSpin 时：未完成 spin → 余额设为 `balance - spinWinSum`（restore 表演再爬回去），
     *    已完成 → 直接设为 `balance`。
     *
     * 逐画面赢分爬升不受此开关控制，由游戏端在每段连线表演开始时
     * 主动调用 `applyScreenWinDisplay()`。
     */
    autoBalanceUpdate?: boolean;
    /**
     * 判斷 lastSpin 結果是否未完成。
     * 預設: `!result.isFinished`
     */
    isLastSpinUnfinished?(result: TResult): boolean;
    /**
     * lastSpin 載入後的額外處理（如設定 freeGameMode）。
     * 預設: 根據 result.isFree 設定 freeGameMode
     */
    onLastSpinLoaded?(result: TResult): void;
    /**
     * spin 結果要用什麼事件名。
     * 預設: BASE_GAME_EVENTS.SPIN_RESULT
     */
    getSpinResultEventName?(result: TResult): string;
    /**
     * 是否要發送 SPIN_START 事件。
     * 預設: true（cascade 時自動返回 false）
     */
    shouldEmitSpinStartEvents?(): boolean;
    /**
     * 判斷當前 spin 結果是否需要繼續 cascade。
     * 預設: `!result.isSpinFinished`
     */
    isCascade?(result: TResult): boolean;
    /**
     * cascade spin 開始前的 callback（設定 UI 狀態等）。
     * 預設: 無動作
     */
    onCascadeStart?(): void;
    /**
     * 所有 cascade 結束後的 callback（重設 UI 狀態等）。
     * 預設: 無動作
     */
    onCascadeEnd?(): void;
    /**
     * spin 完成後的遊戲特定流程（cascade 之後才執行）。
     * 返回 true 表示已處理（如 free game entry）。
     * 返回 false 則繼續預設的 free game / auto-spin / standby 流程。
     * 注意：cascade 已由 BaseGameServiceLogic 內部處理，不需要在此呼叫 spin()。
     * 預設: 返回 false
     */
    onSpinComplete?(result: TResult): Promise<boolean>;
    /**
     * restoreLastSpin 完成後的動作。
     * 預設: 回 STANDBY
     */
    onRestoreComplete?(result: TResult): Promise<void>;
}
//# sourceMappingURL=IGameServiceHooks.d.ts.map