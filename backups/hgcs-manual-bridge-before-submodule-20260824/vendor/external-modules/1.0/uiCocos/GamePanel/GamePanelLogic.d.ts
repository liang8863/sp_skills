import type { IGamePanelView } from "./IGamePanelView";
import type { ILogger } from "../../core/Logger/ILogger";
import type { IEventSystem } from "../../core/EventSystem/IEventSystem";
import type { IGameActionService } from "../../core/GameAction/IGameActionService";
import { AbstractMarqueeBarLogic, IMarqueeConfig } from "./AbstractMarqueeBarLogic";
import { AbstractInfoBarLogic } from "./AbstractInfoBarLogic";
import { AbstractControlPanelLogic } from "./AbstractControlPanelLogic";
import { AbstractMenuPanelLogic } from "./AbstractMenuPanelLogic";
import { AbstractAutoSpinPanelLogic, type AutoSpinConfig } from "./AbstractAutoSpinPanelLogic";
import { AbstractReelsContainerLogic } from "./AbstractReelsContainerLogic";
import { BetPanelLogic, type BetPanelConfig } from "./BetPanelLogic";
import type { IMarqueeBarView } from "./IMarqueeBarView";
import type { IInfoBarView } from "./IInfoBarView";
import type { IControlPanelView } from "./IControlPanelView";
import type { IMenuPanelView } from "./IMenuPanelView";
import type { IAutoSpinPanelView } from "./IAutoSpinPanelView";
import type { IReelsContainerView } from "./IReelsContainerView";
/**
 * GamePanelLogic 配置接口
 *
 * 允許在創建 GamePanelLogic 時傳入自定義 Logic 類
 */
export interface GamePanelLogicConfig {
    /** MarqueeBar 配置 */
    marqueeConfig?: IMarqueeConfig;
    /** BetPanel 配置 */
    betPanelConfig?: BetPanelConfig;
    /** AutoSpinPanel 配置 */
    autoSpinConfig?: AutoSpinConfig;
    /** 自定義 MarqueeBarLogic 類（可選） */
    marqueeBarLogicClass?: new (view: IMarqueeBarView, logger: ILogger, config?: IMarqueeConfig) => AbstractMarqueeBarLogic;
    /** 自定義 InfoBarLogic 類（可選） */
    infoBarLogicClass?: new (view: IInfoBarView, logger: ILogger, eventSystem: IEventSystem, gameActionService: IGameActionService) => AbstractInfoBarLogic;
    /** 自定義 ControlPanelLogic 類（可選） */
    controlPanelLogicClass?: new (view: IControlPanelView, logger: ILogger) => AbstractControlPanelLogic;
    /** 自定義 MenuPanelLogic 類（可選） */
    menuPanelLogicClass?: new (view: IMenuPanelView, logger: ILogger) => AbstractMenuPanelLogic;
    /** 自定義 ReelsContainerLogic 類（可選） */
    reelsContainerLogicClass?: new (view: IReelsContainerView, logger: ILogger) => AbstractReelsContainerLogic;
    /**
     * Spin 處理回調（可選）
     * - 由 GameService 提供
     * - 當玩家按下 SPIN 按鈕時調用
     */
    spinHandler?: (betInfo: import('./BetPanelLogic').BetInfo) => Promise<void>;
    /**
     * AutoSpin 處理回調（可選）
     * - 由 GameService 提供
     * - 當玩家啟動自動旋轉時調用
     */
    autoSpinHandler?: (count: number, betInfo: import('./BetPanelLogic').BetInfo) => Promise<void>;
}
/**
 * GamePanel 邏輯層（容器）
 *
 * 職責：
 * - 組合管理 6 個子組件的 Logic
 * - 提供統一的對外接口
 * - 協調子組件之間的交互
 */
export declare class GamePanelLogic {
    private view;
    private logger;
    private config?;
    private marqueeBarLogic;
    private infoBarLogic;
    private controlPanelLogic;
    private menuPanelLogic;
    private autoSpinPanelLogic;
    private betPanelLogic;
    private reelsContainerLogic;
    private playerDataManager;
    private gameActionService;
    private gameStateManager;
    private eventSystem;
    constructor(view: IGamePanelView, logger: ILogger, config?: GamePanelLogicConfig | undefined);
    /**
     * 初始化 GamePanel（創建所有子組件的 Logic）
     */
    initialize(): void;
    /**
     * 顯示 GamePanel
     */
    show(): void;
    /**
     * 隱藏 GamePanel
     */
    hide(): void;
    /**
     * MarqueeBar - 設置跑馬燈文字
     */
    setMarqueeMessage(message: string): void;
    /**
     * InfoBar - 更新玩家資訊
     */
    updatePlayerInfo(coins: number, bet: number, win: number): void;
    /**
     * ControlPanel - 啟用/禁用控制按鈕
     */
    setControlButtonsEnabled(enabled: boolean): void;
    /**
     * MenuPanel - 顯示選單
     */
    showMenuPanel(): void;
    /**
     * MenuPanel - 隱藏選單
     */
    hideMenuPanel(): void;
    /**
     * ReelsContainer - 獲取滾輪容器
     */
    getReelsContainerNode(): import("cc").Node | null;
    /**
     * 增加下注金額（Bet+ 按鈕）
     * 協調 BetPanelLogic 和 PlayerDataManager
     */
    incrementBet(): void;
    /**
     * 減少下注金額（Bet- 按鈕）
     * 協調 BetPanelLogic 和 PlayerDataManager
     */
    decrementBet(): void;
    /**
     * 獲取 MarqueeBarLogic 實例
     * @returns MarqueeBarLogic 實例或 null
     */
    getMarqueeBarLogic(): AbstractMarqueeBarLogic | null;
    /**
     * 獲取 InfoBarLogic 實例
     * @returns InfoBarLogic 實例或 null
     */
    getInfoBarLogic(): AbstractInfoBarLogic | null;
    /**
     * 獲取 ControlPanelLogic 實例
     * @returns ControlPanelLogic 實例或 null
     */
    getControlPanelLogic(): AbstractControlPanelLogic | null;
    /**
     * 獲取 MenuPanelLogic 實例
     * @returns MenuPanelLogic 實例或 null
     */
    getMenuPanelLogic(): AbstractMenuPanelLogic | null;
    /**
     * 獲取 BetPanelLogic 實例
     * @returns BetPanelLogic 實例或 null
     */
    getBetPanelLogic(): BetPanelLogic | null;
    /**
     * 獲取 ReelsContainerLogic 實例
     * @returns ReelsContainerLogic 實例或 null
     */
    getReelsContainerLogic(): AbstractReelsContainerLogic | null;
    /**
     * 同步 Sound 按鈕狀態
     *
     * 根據 AudioManager 的當前靜音狀態，同步 MenuPanel 的 UI 顯示。
     * 應在 AudioManager 初始化完成後調用此方法。
     *
     * @example
     * ```typescript
     * // 在 Bootstrap 中，AudioManager 初始化後調用
     * if (window.gamePanelLogic) {
     *   window.gamePanelLogic.syncSoundButtonState();
     * }
     * ```
     */
    syncSoundButtonState(): void;
    /**
     * 創建 MarqueeBarLogic 實例
     * @param view MarqueeBar View
     * @returns MarqueeBarLogic 實例
     */
    protected createMarqueeBarLogic(view: IMarqueeBarView): AbstractMarqueeBarLogic;
    /**
     * 創建 InfoBarLogic 實例
     * @param view InfoBar View
     * @returns InfoBarLogic 實例
     */
    protected createInfoBarLogic(view: IInfoBarView): AbstractInfoBarLogic;
    /**
     * 創建 ControlPanelLogic 實例
     * @param view ControlPanel View
     * @returns ControlPanelLogic 實例
     */
    protected createControlPanelLogic(view: IControlPanelView): AbstractControlPanelLogic;
    /**
     * 創建 MenuPanelLogic 實例
     * @param view MenuPanel View
     * @returns MenuPanelLogic 實例
     */
    protected createMenuPanelLogic(view: IMenuPanelView): AbstractMenuPanelLogic;
    /**
     * 創建 AutoSpinPanelLogic 實例
     * @param view AutoSpinPanel View
     * @returns AutoSpinPanelLogic 實例
     */
    protected createAutoSpinPanelLogic(view: IAutoSpinPanelView): AbstractAutoSpinPanelLogic;
    /**
     * 創建 ReelsContainerLogic 實例
     * @param view ReelsContainer View
     * @returns ReelsContainerLogic 實例
     */
    protected createReelsContainerLogic(view: IReelsContainerView): AbstractReelsContainerLogic;
    /**
     * 註冊所有 GameAction 的 executor（UI 層默認實現）
     *
     * 這些 executor 提供了基本的 UI 操作（顯示/隱藏面板），
     * 遊戲層可以通過重新註冊來覆蓋這些實現。
     */
    protected registerGameActions(): void;
    /**
     * 遊戲狀態變化處理（自動控制 UI 顯示/隱藏）
     *
     * ## 架構設計說明
     *
     * 本方法是 **UI 狀態控制的唯一入口**，所有與遊戲狀態相關的 UI 變化都應該在這裡處理。
     *
     * ### 為什麼使用事件監聽而不是 StateConfig 回調？
     *
     * 1. **分層原則**：
     *    - Core 層（GameStateManager）不應該知道 UI 層的存在
     *    - UI 層通過事件被動響應 Core 層的變化
     *    - 避免循環依賴
     *
     * 2. **職責分離**：
     *    - GameStateManager：狀態邏輯、驗證、歷史
     *    - GamePanelLogic：UI 顯示、用戶交互
     *    - EventSystem：通訊橋樑
     *
     * 3. **易於擴展**：
     *    - 遊戲可以繼承此類並覆蓋此方法
     *    - 無需修改 Core 層代碼
     *    - 可以添加遊戲特定的 UI 邏輯
     *
     * ### 擴展示例
     *
     * ```typescript
     * // 在遊戲項目中
     * export class CustomGamePanelLogic extends GamePanelLogic {
     *   protected override onGameStateChanged(event: StateChangedEvent): void {
     *     // 先執行基礎邏輯
     *     super.onGameStateChanged(event);
     *
     *     // 添加遊戲特定的 UI
     *     if (event.toState === GAME_STATES.FREE_GAMING) {
     *       this.showFreeGameBanner();
     *       this.playFreeGameAnimation();
     *     }
     *   }
     * }
     * ```
     *
     * @param event - 狀態變化事件，包含 fromState、toState、timestamp
     */
    protected onGameStateChanged(event: {
        fromState: string;
        toState: string;
        timestamp: number;
    }): void;
}
//# sourceMappingURL=GamePanelLogic.d.ts.map