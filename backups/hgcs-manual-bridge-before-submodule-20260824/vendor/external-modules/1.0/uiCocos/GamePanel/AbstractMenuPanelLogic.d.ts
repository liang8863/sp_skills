import type { IMenuPanelView } from "./IMenuPanelView";
import type { ILogger } from "../../core/Logger/ILogger";
import type { IAudioButtonView } from "../Common/IAudioButtonView";
/**
 * MenuPanel 抽象邏輯層
 *
 * 職責：提供選單面板的基礎邏輯，可被子類繼承和擴展
 */
export declare abstract class AbstractMenuPanelLogic {
    protected view: IMenuPanelView;
    protected logger: ILogger;
    /**
     * Sound 狀態（true: 開啟, false: 關閉）
     */
    private soundEnabled;
    /** 音效按鈕邏輯管理器 */
    private audioButtons;
    /** Hover 事件回調（用於解除綁定） */
    private hoverCallbacks;
    /** 節點原始位置（用於動畫恢復） */
    private originalPosition;
    constructor(view: IMenuPanelView, logger: ILogger);
    /**
     * 遞歸設置節點樹的透明度
     * @param node 目標節點
     * @param opacity 透明度 (0-255)
     */
    private setNodeTreeOpacity;
    /**
     * 顯示選單面板
     * @param animated 是否播放動畫（默認 false）
     */
    show(animated?: boolean): void;
    /**
     * 隱藏選單面板
     * @param animated 是否播放動畫（默認 false）
     */
    hide(animated?: boolean): void;
    /**
     * 設置 Sound 狀態（由 GameController 調用）
     * @param enabled 是否啟用 Sound
     */
    setSoundEnabled(enabled: boolean): void;
    /**
     * 獲取當前 Sound 狀態
     */
    getSoundEnabled(): boolean;
    /**
     * 更新 Sound Sprite 顯示狀態
     */
    private updateSoundSprites;
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
    protected onQuitButtonClick(): Promise<void>;
    protected onSoundButtonClick(): Promise<void>;
    protected onPaytableButtonClick(): Promise<void>;
    protected onRulesButtonClick(): Promise<void>;
    protected onHistoryButtonClick(): Promise<void>;
    protected onCloseButtonClick(): Promise<void>;
}
//# sourceMappingURL=AbstractMenuPanelLogic.d.ts.map