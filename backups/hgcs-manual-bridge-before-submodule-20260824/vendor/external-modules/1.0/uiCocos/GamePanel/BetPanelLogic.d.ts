import type { IBetPanelView } from "./IBetPanelView";
import type { ILogger } from "../../core/Logger/ILogger";
import type { IEventSystem } from "../../core/EventSystem/IEventSystem";
import type { IGameActionService } from "../../core/GameAction/IGameActionService";
import type { IPlayerDataManager } from "../../services/IPlayerDataManager";
import { AbstractBetPanelLogic } from "./AbstractBetPanelLogic";
/**
 * 投注配置接口
 */
export interface BetPanelConfig {
    /**
     * 投注大小選項
     */
    betSizeOptions: number[];
    /**
     * 投注等級選項
     */
    betLevelOptions: number[];
    /**
     * 基礎投注選項 (通常只有一個選項)
     */
    baseBetOptions: number[];
}
/**
 * 投注資訊接口
 */
export interface BetInfo {
    betSize: number;
    betLevel: number;
    baseBet: number;
    betAmount: number;
    p1?: number;
}
/**
 * BetPanel 邏輯層
 *
 * 職責：
 * - 管理投注設置面板的業務邏輯
 * - 四個選擇器 (betSize, betLevel, baseBet, betAmount) 的聯動
 * - 計算投注金額
 * - 處理最大投注和確定按鈕
 * - 通過 EventSystem 監聽和發送事件
 * - 通過 GameAction 執行遊戲操作
 */
export declare class BetPanelLogic extends AbstractBetPanelLogic {
    private eventSystem;
    private gameActionService;
    private playerDataManager;
    private config;
    private betSizePickerLogic;
    private betLevelPickerLogic;
    private baseBetPickerLogic;
    private betAmountPickerLogic;
    private betSizeIndex;
    private betLevelIndex;
    private baseBetIndex;
    private betAmountList;
    private betAmountIndex;
    private snapshotBetSizeIndex;
    private snapshotBetLevelIndex;
    private snapshotBaseBetIndex;
    private hasInitialized;
    private balance;
    private currentBet;
    private lastWin;
    private audioButtons;
    private slidingPickerCount;
    constructor(view: IBetPanelView, logger: ILogger, eventSystem: IEventSystem, gameActionService: IGameActionService, playerDataManager: IPlayerDataManager, config?: Partial<BetPanelConfig>);
    /**
     * 初始化
     */
    initialize(): void;
    /**
     * 銷毀
     */
    destroy(): void;
    /**
     * 顯示面板
     *
     * 覆寫：每次開啟都把 picker 同步回 PlayerDataManager 的當前下注額，
     * 避免上次拖曳未按確定就關閉時殘留的暫存值。
     */
    show(animated?: boolean): void;
    /**
     * 將 4 個 picker 同步到 PlayerDataManager 當前 betAmount
     */
    private syncPickersToCurrentBet;
    /**
     * 還原 picker 到開啟前的拆分（取消/遮罩關閉時呼叫）
     *
     * 靜默設定 picker（不觸發 onValueChanged、不跑動畫），
     * 確保下次開啟時 syncPickersToCurrentBet 的 isStillValid 判斷可信。
     */
    private restoreSnapshot;
    /**
     * 設定配置
     */
    setConfig(config: Partial<BetPanelConfig>): void;
    /**
     * 設定貨幣（覆寫父類，順便刷新 picker 選項以套用新符號）
     */
    setCurrency(currency: string): void;
    /**
     * 獲取下一個投注金額（用於 Bet+ 按鈕）
     * @returns 下一個投注金額，如已達上限則返回 undefined
     */
    getNextBetAmount(): number | undefined;
    /**
     * 獲取上一個投注金額（用於 Bet- 按鈕）
     * @returns 上一個投注金額，如已達下限則返回 undefined
     */
    getPreviousBetAmount(): number | undefined;
    /**
     * 檢查是否已達最小投注金額
     */
    isAtMinBet(): boolean;
    /**
     * 檢查是否已達最大投注金額
     */
    isAtMaxBet(): boolean;
    /**
     * 獲取當前投注金額（用於 confirmButton）
     */
    getCurrentBetAmount(): number;
    setDefaultBetData(defaultSize: number, defaultLevel: number): void;
    /**
     * 計算投注金額列表
     * 所有 betSize × betLevel × baseBet 組合，排序去重
     */
    private calculateBetAmountList;
    /**
     * 初始化四個選擇器
     */
    private initializePickers;
    /**
     * 註冊按鈕事件
     */
    private registerButtonEvents;
    /**
     * 取消註冊按鈕事件
     */
    private unregisterButtonEvents;
    /**
     * 註冊 EventSystem 事件
     */
    private registerSystemEvents;
    /**
     * 取消註冊 EventSystem 事件
     */
    private unregisterSystemEvents;
    /**
     * betSize 改變
     */
    private onBetSizeChanged;
    /**
     * betLevel 改變
     */
    private onBetLevelChanged;
    /**
     * baseBet 改變
     */
    private onBaseBetChanged;
    /**
     * betAmount 改變（使用者直接拖動 BetAmount Picker）
     * 反推 betSize/betLevel/baseBet 的最佳組合，並讓三個 picker 滑到對應檔位
     */
    private onBetAmountChanged;
    /**
     * 選擇器滑動狀態改變（拖曳中或吸附動畫期間）
     * 滑動期間禁能 confirmButton 與 maxBetButton，避免誤觸
     */
    private onPickerSlidingStateChanged;
    /**
     * 根據滑動狀態更新 confirmButton 與 maxBetButton 的 interactable
     * 滑動結束後 maxBetButton 交還給 checkMaxBetButton 判斷
     */
    private updateActionButtonsInteractable;
    /**
     * 最大投注按鈕點擊
     */
    private onMaxBetClick;
    /**
     * 確定按鈕點擊
     */
    private onConfirmClick;
    /**
     * 關閉按鈕點擊（取消：還原 picker 到開啟前拆分）
     */
    private onCloseClick;
    /**
     * 遮罩按鈕點擊處理（點擊背景關閉面板，視同取消）
     */
    private onMaskClick;
    /**
     * 餘額更新
     */
    private onBalanceUpdate;
    /**
     * PlayerData 下注金額更新事件處理（由 PlayerDataManager 觸發）
     *
     * 觸發來源：
     * - 主畫面 Bet+/Bet- 按鈕（外部 setBetAmount）→ 需要反推 betSize/betLevel/baseBet
     * - BetPanel confirm 寫回（內部 setBetAmount）→ 當前拆分仍有效，不反推
     */
    private onPlayerDataBetAmountChanged;
    /**
     * 發送下注邊界狀態變化事件
     */
    private emitBetBoundsChanged;
    /**
     * 上次獲勝金額更新
     */
    private onLastWinUpdate;
    /**
     * 更新所有 UI
     */
    private updateAllUI;
    /**
     * 更新 BetSize 選擇器
     */
    private updateBetSizePicker;
    /**
     * 更新 BetLevel 選擇器
     */
    private updateBetLevelPicker;
    /**
     * 更新 BaseBet 選擇器
     */
    private updateBaseBetPicker;
    /**
     * 更新 BetAmount 選擇器
     */
    private updateBetAmountPicker;
    /**
     * 檢查最大投注按鈕狀態
     */
    private checkMaxBetButton;
    /**
     * 統一設定最大投注按鈕的 interactable，並同步調整標題 Label 透明度
     * （禁能 = 70% alpha / 178，啟用 = 100% alpha / 255）
     */
    private setMaxBetInteractable;
    /**
     * 計算當前投注總額
     */
    private calculateCurrentBetAmount;
    /**
     * 找到最接近的 betAmount 索引
     */
    private findBetAmountIndex;
    /**
     * 反推最佳組合
     * @param targetBetAmount 目標下注金額
     * @param preferMaxBetLevel true: 優先選 betLevel 較大；false（預設）: 優先選 betLevel 較小
     */
    private findBestCombination;
    /**
     * 獲取當前投注資訊
     *
     * @returns 當前投注設定（betSize, betLevel, baseBet, betAmount）
     *
     * @example
     * ```typescript
     * const betInfo = betPanelLogic.getCurrentBetInfo();
     * console.log('投注大小:', betInfo.betSize);
     * console.log('投注倍率:', betInfo.betLevel);
     * console.log('基礎投注:', betInfo.baseBet);
     * console.log('總投注額:', betInfo.betAmount);
     * ```
     */
    getCurrentBetInfo(): BetInfo;
}
//# sourceMappingURL=BetPanelLogic.d.ts.map