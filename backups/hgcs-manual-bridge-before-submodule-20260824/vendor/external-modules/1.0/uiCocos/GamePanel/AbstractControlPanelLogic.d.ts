import type { IControlPanelView } from "./IControlPanelView";
import type { ILogger } from "../../core/Logger/ILogger";
import type { IAudioButtonView } from "../Common/IAudioButtonView";
/**
 * ControlPanel 抽象邏輯層
 *
 * 職責：提供遊戲控制按鈕的基礎邏輯，可被子類繼承和擴展
 */
export declare abstract class AbstractControlPanelLogic {
    protected view: IControlPanelView;
    protected logger: ILogger;
    protected onBetIncrement?: () => void;
    protected onBetDecrement?: () => void;
    /**
     * Turbo 狀態（true: 開啟, false: 關閉）
     */
    private turboEnabled;
    /**
     * 自動旋轉模式（true: 進行中, false: 未啟用）
     */
    private isInAutoSpinMode;
    /**
     * 自動旋轉剩餘次數（用於 UI 顯示）
     */
    private autoSpinRemaining;
    /** 音效按鈕邏輯管理器 */
    private audioButtons;
    /** Hover 事件回調（用於解除綁定） */
    private hoverCallbacks;
    /** 節點原始位置（用於動畫恢復） */
    private originalPosition;
    /** 快取的下注邊界狀態 */
    private cachedBetBounds;
    constructor(view: IControlPanelView, logger: ILogger);
    /**
     * 設置 Bet 增加 callback（由 GamePanelLogic 調用）
     */
    setOnBetIncrement(callback: () => void): void;
    /**
     * 設置 Bet 減少 callback（由 GamePanelLogic 調用）
     */
    setOnBetDecrement(callback: () => void): void;
    /**
     * 設置 Turbo 狀態（由 GamePanelLogic 或 GameController 調用）
     * @param enabled 是否啟用 Turbo
     */
    setTurboEnabled(enabled: boolean): void;
    /**
     * 獲取當前 Turbo 狀態
     */
    getTurboEnabled(): boolean;
    /**
     * 更新 Turbo Sprite 顯示狀態
     */
    private updateTurboSprites;
    /**
     * 播放 Turbo Spine 動畫
     * @param enabled 是否開啟 Turbo（true: 播放 TURBO 動畫, false: 播放 STOP 動畫）
     */
    private playTurboSpineAnimation;
    /** 需要禁用時變色的按鈕列表（使用 SCALE transition 但禁用時要變灰） */
    private readonly buttonsNeedDisabledColor;
    /**
     * 設置按鈕的 interactable 狀態，並根據需要改變顏色
     * @param buttonView 按鈕 View
     * @param enabled 是否啟用
     * @param buttonKey 按鈕標識（用於判斷是否需要變色）
     */
    private setButtonInteractable;
    /**
     * 遞歸設置按鈕節點樹的顏色
     * @param node 目標節點
     * @param color 顏色
     */
    private setButtonColor;
    /**
     * 啟用/禁用所有控制按鈕
     * @param enabled 是否啟用
     */
    setButtonsEnabled(enabled: boolean): void;
    /**
     * 啟用/禁用 Spin 鎖定按鈕（不包含 Turbo）
     * 只有 STANDBY 狀態下這些按鈕才可按
     * @param enabled 是否啟用
     */
    setSpinLockButtonsEnabled(enabled: boolean): void;
    /**
     * 遞歸設置節點樹的透明度
     * @param node 目標節點
     * @param opacity 透明度 (0-255)
     */
    private setNodeTreeOpacity;
    /**
     * show/hide 動畫對象：有 menuContent 則用它，否則 fallback 用根節點。
     */
    private getAnimationTarget;
    /**
     * 有 menuContent 時，額外淡入/淡出的 Spin 按鈕 UIOpacity；否則回傳 null。
     * 字串取件避開 UMD bundle 下 cc.UIOpacity 可能為 undefined。
     */
    private getSpinFadeUIOpacity;
    /**
     * 顯示組件
     * @param animated 是否播放動畫（默認 false）
     */
    show(animated?: boolean): void;
    /**
     * 隱藏組件
     * @param animated 是否播放動畫（默認 false）
     */
    hide(animated?: boolean): void;
    /**
     * 初始化（綁定按鈕事件，記錄原始位置）
     */
    initialize(): void;
    /**
     * 銷毀（解除按鈕事件綁定）
     */
    destroy(): void;
    /**
     * 綁定按鈕事件（含音效）
     */
    protected bindButtonEvents(): void;
    /**
     * 解除按鈕事件綁定
     */
    protected unbindButtonEvents(): void;
    /**
     * 為按鈕綁定 Hover 效果（顯示/隱藏底板）
     * @param buttonView 按鈕 View
     * @param buttonKey 按鈕標識（用於管理回調）
     * @param hoverBgName 底板節點名稱，默認 'HoverBg'
     */
    protected bindHoverEffect(buttonView: IAudioButtonView | null, buttonKey: string, hoverBgName?: string): void;
    /**
     * 解除單個按鈕的 Hover 效果綁定
     */
    protected unbindHoverEffect(buttonView: IAudioButtonView | null, buttonKey: string): void;
    /**
     * 解除所有按鈕的 Hover 效果綁定
     */
    private unbindAllHoverEffects;
    /**
     * 按鈕點擊處理（預留給子類實現）
     */
    protected onSpinButtonClick(): Promise<void>;
    protected onMenuButtonClick(): Promise<void>;
    protected onTurboButtonClick(): Promise<void>;
    protected onBetMinusButtonClick(): void;
    protected onBetPlusButtonClick(): void;
    /**
     * 顯示投注邊界 toast 提示
     * @param message 提示訊息
     */
    private showBetBoundToast;
    protected onAutoButtonClick(): Promise<void>;
    /**
     * 遊戲狀態變化處理
     * 只有 STANDBY 狀態下才啟用按鈕（除了 Turbo 隨時可按）
     */
    protected onGameStateChanged(event: {
        fromState: string;
        toState: string;
    }): void;
    /**
     * 收到 Spin 結果後，啟用 Spin 按鈕（允許跳過動畫）
     */
    private onSpinResultReceived;
    /**
     * 單獨控制 Spin 按鈕啟用/禁用
     */
    private setSpinButtonEnabled;
    /**
     * 自動旋轉停止按鈕點擊處理
     */
    protected onAutoSpinStopButtonClick(): Promise<void>;
    /**
     * 處理自動旋轉開始事件
     */
    private onAutoSpinStart;
    /**
     * 處理自動旋轉進度事件
     */
    private onAutoSpinProgress;
    /**
     * 處理停止自動旋轉事件
     */
    private onAutoSpinStop;
    /**
     * 處理自動旋轉完成事件
     */
    private onAutoSpinComplete;
    /**
     * 切換到自動旋轉按鈕
     */
    private switchToAutoSpinButton;
    /**
     * 切換回普通 Spin 按鈕
     */
    private switchToNormalSpinButton;
    /**
     * 更新自動旋轉次數顯示
     */
    private updateAutoSpinCount;
    /**
     * 顯示自動旋轉按鈕
     */
    private showAutoSpinButton;
    /**
     * 隱藏自動旋轉按鈕
     */
    private hideAutoSpinButton;
    /**
     * 初始化音效關閉圖示狀態
     */
    private initializeAudioOffIcon;
    /**
     * 處理音效靜音狀態變化事件
     */
    private onAudioMuteChanged;
    /**
     * 更新音效關閉圖示顯示狀態
     * @param muted 是否靜音
     */
    private updateAudioOffIcon;
    /**
     * 處理下注邊界狀態變化事件
     * @param data 邊界狀態 { isAtMin, isAtMax }
     */
    private onBetBoundsChanged;
    /**
     * 更新 BetMinus/BetPlus 按鈕的視覺狀態
     * @param isAtMin 是否已達最小投注
     * @param isAtMax 是否已達最大投注
     */
    private updateBetButtonStates;
}
//# sourceMappingURL=AbstractControlPanelLogic.d.ts.map