/**
 * BaseGameServiceLogic - 通用遊戲服務邏輯
 *
 * 使用 Composition + Hooks 模式，提供 spin、auto-spin、
 * free game、cascade 等通用流程。
 *
 * 遊戲端透過 `new BaseGameServiceLogic(...)` + hooks 配置來客製化行為。
 * 不使用繼承（ExternalModules 是動態 <script> 載入，無法 class extends）。
 * 不使用 @injectable()（手動 new）。
 */
import type { ILogger } from "../core/Logger/ILogger";
import type { IEventSystem } from "../core/EventSystem/IEventSystem";
import type { IBaseSpinResult } from "./IBaseSpinResult";
import type { IBaseGameApi } from "./IBaseGameApi";
import type { IGameServiceHooks } from "./IGameServiceHooks";
import type { IBaseGameServiceLogic } from "./IBaseGameServiceLogic";
import type { IBetInfo, ICheckLastSpinResult } from "./GameServiceTypes";
/**
 * GameStateManager 最小介面（避免依賴完整型別）
 */
interface IGameStateManager {
    getCurrentState(): string;
    getPreviousState(): string | null;
    changeState(targetState: string, skipValidation?: boolean): {
        success: boolean;
        reason?: string;
    };
    canTransitionTo(targetState: string): boolean;
    goBack(): {
        success: boolean;
    };
    reset(): void;
}
export declare class BaseGameServiceLogic<TResult extends IBaseSpinResult = IBaseSpinResult> implements IBaseGameServiceLogic<TResult> {
    private logger;
    private eventSystem;
    private gameStateManager;
    private gameApi;
    private hooks;
    private getBetInfoCallback;
    private getTurboModeCallback;
    private _isInAutoSpinMode;
    private autoSpinRemaining;
    private autoSpinTotal;
    private _isInFreeGameMode;
    private freeSpinRemaining;
    private _isCascading;
    private currentSpinResult;
    constructor(logger: ILogger, eventSystem: IEventSystem, gameStateManager: IGameStateManager, gameApi: IBaseGameApi<TResult>, hooks: IGameServiceHooks<TResult>);
    setGetBetInfoCallback(callback: () => IBetInfo): void;
    setGetTurboModeCallback(callback: () => boolean): void;
    getCurrentBetInfo(): IBetInfo;
    isInFreeGameMode(): boolean;
    setFreeGameMode(value: boolean): void;
    /**
     * SPIN_START 時要顯示的贏分金額。
     * - 一般情況回 0（讓 UI 把 winLabel 歸零）
     * - FG 中保留上一輪累計 spinWinSum，避免 winLabel 跳動成 0
     */
    private getSpinStartWinAmount;
    /**
     * 安全取得 PlayerDataManager（取不到时返回 null，不让 spin 流程炸掉）
     */
    private getPlayerDataManagerSafe;
    /**
     * 安全设置余额（setBalance 对非法值会 throw，这里兜底避免中断流程）
     */
    private setBalanceSafe;
    /**
     * ① 扣注显示：新 spin 拿到结果后，把余额显示为「balance - spinWinSum」（即扣注后金额）。
     * FG 模式中跳过重设，避免余额从爬升值掉回「原余额 - bet」破坏单调性。
     * （featureBuy 购买当下 _isInFreeGameMode 仍为 false，扣款显示不受影响）
     */
    private applySpinStartBalance;
    /**
     * ③ 逐画面赢分/余额显示 helper（游戏端在每段连线 win 表演开始时调用）。
     * 发送 UPDATE_WIN(spinWinSum) 并把余额更新为当前 result.balance，
     * 让赢分与余额随表演逐画面爬升。
     *
     * 注意：此方法不受 autoBalanceUpdate 开关限制——游戏端明确调用即代表 opt-in。
     * @param result 不传时默认使用当前 spin 结果
     */
    applyScreenWinDisplay(result?: TResult): void;
    /**
     * ④ 结算：spin 完成后把余额更新为 server 回传的最终 balance
     */
    private applySettlementBalance;
    checkLastSpin(): Promise<ICheckLastSpinResult<TResult>>;
    restoreLastSpin(): Promise<void>;
    spin(betInfo: IBetInfo): Promise<void>;
    featureBuy(betInfo: IBetInfo): Promise<void>;
    /**
     * Spin API 調用，401 時等待新 token 後自動重試一次
     */
    private spinWithRetry;
    /**
     * featureBuy API 調用，401 時等待新 token 後自動重試一次
     */
    private featureBuyWithRetry;
    /**
     * 等待新 Token 到達（最多 10 秒）
     */
    private waitForNewToken;
    /**
     * 處理 spin 完成後的流程
     * 先交給 hooks.onSpinComplete，若未處理則走預設流程
     */
    private handleSpinComplete;
    /**
     * 預設的 spin 完成流程
     * 優先級：免費遊戲繼續 > 自動旋轉 > 結束
     * （cascade 已在 handleSpinComplete 中處理）
     */
    private defaultHandleSpinComplete;
    /**
     * 完整的 spin 完成流程（供 hooks.onRestoreComplete 調用）
     */
    handleSpinCompleteFlow(result: TResult): Promise<void>;
    autoSpin(count: number, betInfo: IBetInfo): Promise<void>;
    stopAutoSpin(): void;
    private isTurboMode;
    private exitAutoSpinMode;
    private exitFreeGameMode;
    private waitForAnimationComplete;
    private onGameStateChanged;
    private onAutoSpinStop;
}
export {};
//# sourceMappingURL=BaseGameServiceLogic.d.ts.map