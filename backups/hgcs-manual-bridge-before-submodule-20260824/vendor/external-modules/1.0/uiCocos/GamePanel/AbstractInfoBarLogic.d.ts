import type { IInfoBarView } from "./IInfoBarView";
import type { ILogger } from "../../core/Logger/ILogger";
import type { IEventSystem } from "../../core/EventSystem/IEventSystem";
import type { IGameActionService } from "../../core/GameAction/IGameActionService";
/**
 * InfoBar 抽象邏輯層
 *
 * 職責：提供玩家資訊欄的基礎邏輯，可被子類繼承和擴展
 *
 * 監聽事件：
 * - `PLAYER_DATA_EVENTS.BALANCE_CHANGED` - 餘額變化 ({ oldBalance, newBalance, delta })
 * - `PLAYER_DATA_EVENTS.BET_AMOUNT_CHANGED` - 下注金額變化 ({ oldBetAmount, newBetAmount })
 * - `PLAYER_DATA_EVENTS.UPDATE_WIN` - 更新贏得金額 (number)
 *
 * 按鈕功能（可選）：
 * - 籌碼按鈕 → OPEN_BALANCE
 * - 下注按鈕 → OPEN_BET_SETTINGS
 * - 贏得按鈕 → OPEN_HISTORY
 */
export declare abstract class AbstractInfoBarLogic {
    protected view: IInfoBarView;
    protected logger: ILogger;
    protected eventSystem: IEventSystem;
    protected gameActionService: IGameActionService;
    /** 小數位數（預設 2 位） */
    protected decimals: number;
    /** 音效按鈕邏輯管理器 */
    private audioButtons;
    /** 数字滚动动画时长（秒） */
    private static readonly ROLL_DURATION;
    /** 筹码当前显示值（tween 目标对象）；null 表示尚未设过值，首次直接 snap */
    private coinsRollState;
    /** 赢得金额当前显示值（tween 目标对象）；null 表示尚未设过值，首次直接 snap */
    private winRollState;
    constructor(view: IInfoBarView, logger: ILogger, eventSystem: IEventSystem, gameActionService: IGameActionService);
    /**
     * 格式化數字（貨幣符號 + 千分位 + 小數點）
     * @param value 數字
     * @returns 格式化後的字串，例如 ¥1,000.00；未知幣別 fallback 為純數字
     */
    protected formatNumber(value: number): string;
    /**
     * 更新玩家資訊
     * @param coins 擁有籌碼
     * @param bet 下注金額
     * @param win 贏得金額
     */
    updatePlayerInfo(coins: number, bet: number, win: number): void;
    /**
     * 将 label 从当前显示值滚动到目标值（0.2 秒）
     * - 已有进行中的 tween 会先停止，从当前显示到一半的值续滚到新目标（不跳回起点、不排队）
     * - 目标值与当前显示值相同时直接返回，不开新 tween
     * - 结束帧强制写入精确目标值，避免浮点误差残留在最终显示
     * @param label 目标 Label
     * @param state 当前显示值对象（tween 目标）
     * @param target 目标数值
     */
    private rollLabelTo;
    /**
     * 停止所有进行中的数字滚动 tween（销毁/移除监听时调用，避免 label 已销毁还在写值）
     */
    private stopRollTweens;
    /**
     * 更新籌碼顯示（0.2 秒数字滚动）
     * @param coins 籌碼數量
     */
    updateCoins(coins: number): void;
    /**
     * 更新下注金額顯示
     * @param bet 下注金額
     */
    updateBet(bet: number): void;
    /**
     * 更新贏得金額顯示（0.2 秒数字滚动）
     * @param win 贏得金額
     */
    updateWin(win: number): void;
    /**
     * 顯示組件
     */
    show(): void;
    /**
     * 隱藏組件
     */
    hide(): void;
    /**
     * 註冊事件監聽器
     */
    protected registerEventListeners(): void;
    /**
     * 移除事件監聽器
     */
    protected unregisterEventListeners(): void;
    /**
     * 註冊按鈕事件監聽器（含音效）
     */
    protected registerButtonEvents(): void;
    /**
     * 移除按鈕事件監聽器
     */
    protected unregisterButtonEvents(): void;
    /**
     * 處理籌碼按鈕點擊事件
     */
    protected onCoinsButtonClick(): Promise<void>;
    /**
     * 處理下注按鈕點擊事件
     */
    protected onBetButtonClick(): Promise<void>;
    /**
     * 處理贏得按鈕點擊事件
     */
    protected onWinButtonClick(): Promise<void>;
    /**
     * 處理更新籌碼事件
     */
    private handleUpdateCoins;
    /**
     * 處理更新下注事件
     */
    private handleUpdateBet;
    /**
     * 處理更新贏得事件
     */
    private handleUpdateWin;
    /**
     * 初始化
     */
    initialize(): void;
    /**
     * 銷毀
     */
    destroy(): void;
}
//# sourceMappingURL=AbstractInfoBarLogic.d.ts.map