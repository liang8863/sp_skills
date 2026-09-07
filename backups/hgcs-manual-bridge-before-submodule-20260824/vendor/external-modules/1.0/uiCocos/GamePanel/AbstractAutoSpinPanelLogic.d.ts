import type { IAutoSpinPanelView } from "./IAutoSpinPanelView";
import type { ILogger } from "../../core/Logger/ILogger";
import { Label, Toggle, Node } from "cc";
/**
 * AutoSpinPanel 配置接口
 */
export interface AutoSpinConfig {
    /**
     * 自動旋轉次數選項
     * @example [10, 30, 50, 80, 1000]
     */
    countOptions: number[];
}
/**
 * AutoSpinPanel 抽象邏輯層
 *
 * 職責：提供自動旋轉設定面板的基礎邏輯，可被子類繼承和擴展
 */
export declare abstract class AbstractAutoSpinPanelLogic {
    protected view: IAutoSpinPanelView;
    protected logger: ILogger;
    protected config?: AutoSpinConfig | undefined;
    /**
     * 當前選中的自動旋轉次數
     */
    protected selectedCount: number;
    /**
     * 當前生成的 Toggle 節點列表（用於樣式切換和數據綁定）
     */
    protected countToggleNodes: Array<{
        node: Node;
        toggle: Toggle;
        label: Label | null;
        count: number;
    }>;
    /**
     * Toggle Label 顏色配置（從 View 獲取）
     */
    private toggleLabelColors;
    /**
     * StartButton 顏色配置（從 View 獲取）
     */
    private startButtonColors;
    /** 音效按鈕邏輯管理器 */
    private audioButtons;
    /** 節點原始位置（用於動畫恢復） */
    private originalPosition;
    /** ContentBackground 高度（用於動畫偏移計算） */
    private contentHeight;
    /** 事件系統（用於監聽玩家數據變化） */
    private eventSystem;
    /** 玩家數據管理器（用於獲取當前數據） */
    private playerDataManager;
    /** 當前贏分（用於 InfoBar 顯示） */
    private currentWin;
    /** 是否正在關閉面板（防止 Cancel/Mask 連點觸發多次關閉動畫） */
    private isClosing;
    /** 次數 Toggle 點擊音效管理器（延遲初始化） */
    private toggleAudioManager;
    /** 次數 Toggle 點擊音效 key（與其他按鈕一致） */
    private static readonly TOGGLE_CLICK_SOUND_KEY;
    constructor(view: IAutoSpinPanelView, logger: ILogger, config?: AutoSpinConfig | undefined);
    /**
     * 獲取 Toggle Label 顏色配置（延遲初始化）
     */
    private getToggleLabelColors;
    /**
     * 獲取 StartButton 顏色配置（延遲初始化）
     */
    private getStartButtonColors;
    /**
     * 播放次數 Toggle 的點擊音效
     *
     * Toggle 繼承自 Button，會發出 Button.EventType.CLICK，故每次點擊（含重複點同一顆）都會觸發。
     * AudioManager 延遲取得，未就緒時靜默略過。
     */
    private playToggleClickSound;
    /**
     * 設定自動旋轉次數選項（動態生成 Toggle）
     * @param counts 次數選項陣列，例如：[10, 30, 50, 80, 1000]
     */
    setAutoSpinCountOptions(counts: number[]): void;
    /**
     * 更新 InfoBar 顯示
     * @param balance 餘額
     * @param bet 下注金額
     * @param win 贏得金額
     */
    updateInfoBar(balance: number, bet: number, win: number): void;
    /**
     * 設置節點透明度（遞歸設置所有子節點）
     * @param node 目標節點
     * @param opacity 透明度 (0-255)
     */
    private setNodeOpacity;
    /**
     * 重設所有 Toggle 為未選中狀態
     *
     * 保持 allowSwitchOff = true，否則 ToggleContainer 會因「至少一個要選中」規則
     * 自動補選第一個。等到使用者選了第一個後再於 onCountToggleChanged 鎖回 false。
     */
    protected resetToggleSelection(): void;
    /**
     * 顯示面板
     * @param animated 是否播放動畫（默認 true）
     */
    show(animated?: boolean): void;
    /**
     * 隱藏面板
     * @param animated 是否播放動畫（默認 true）
     */
    hide(animated?: boolean): void;
    /**
     * 獲取當前選中的次數
     */
    getSelectedCount(): number;
    /**
     * 設定選中的次數（更新 UI 狀態）
     * @param count 選中的次數
     */
    setSelectedCount(count: number): void;
    /**
     * 初始化（綁定按鈕事件，生成次數選項）
     */
    initialize(): void;
    /**
     * 銷毀（解除所有事件綁定）
     */
    destroy(): void;
    /**
     * 綁定玩家數據變化事件
     */
    private bindPlayerDataEvents;
    /**
     * 解除玩家數據變化事件綁定
     */
    private unbindPlayerDataEvents;
    /**
     * 餘額變化事件處理
     */
    private onBalanceChanged;
    /**
     * 下注金額變化事件處理
     */
    private onBetAmountChanged;
    /**
     * 贏分更新事件處理
     */
    private onWinUpdate;
    /**
     * 綁定按鈕事件（含音效）
     */
    protected bindButtonEvents(): void;
    /**
     * 解除按鈕事件綁定
     */
    protected unbindButtonEvents(): void;
    /**
     * 更新 Toggle 選中狀態（實現 Label 顏色切換）
     * @param selectedCount 當前選中的次數
     */
    protected updateToggleStates(selectedCount: number): void;
    /**
     * 更新 StartButton 的啟用/禁用狀態和顏色
     * 根據是否有選中的次數來決定按鈕是否可點擊
     */
    protected updateStartButtonState(): void;
    /**
     * 次數 Toggle 改變處理（預留給子類實現）
     * @param count 選中的次數
     */
    protected onCountToggleChanged(count: number): Promise<void>;
    /**
     * 開始按鈕點擊處理（預留給子類實現）
     */
    protected onStartButtonClick(): Promise<void>;
    /**
     * 取消按鈕點擊處理（預留給子類實現）
     */
    protected onCancelButtonClick(): Promise<void>;
    /**
     * 遮罩按鈕點擊處理（點擊背景關閉面板）
     */
    protected onMaskButtonClick(): Promise<void>;
}
//# sourceMappingURL=AbstractAutoSpinPanelLogic.d.ts.map