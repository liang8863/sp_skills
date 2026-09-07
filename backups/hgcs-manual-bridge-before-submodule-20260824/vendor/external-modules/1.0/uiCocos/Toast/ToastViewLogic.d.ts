import { Node, SpriteFrame, Color } from "cc";
import type { IToastView } from "./IToastView";
import type { ILogger } from "../../core/Logger/ILogger";
/**
 * Toast View 邏輯層（通過 DI 注入 View）
 *
 * 包含所有動畫和顯示邏輯，完全控制 Toast 的業務邏輯
 * View 只負責提供 Cocos 組件的訪問
 *
 * 動畫流程：
 * 1. 彈出：scale 1→1.2→1.0 (0.3s)
 * 2. 停留：保持顯示 (1s)
 * 3. 淡出：fade out (0.5s)
 *
 * 注意：此類用於 ObjectPool，有 reset() 方法用於重置狀態
 */
export declare class ToastViewLogic {
    private view;
    private logger;
    private maxDuration;
    private static iconCache;
    private readonly SHOW_DURATION;
    private readonly STAY_DURATION;
    private readonly HIDE_DURATION;
    private readonly SCALE_PEAK;
    private readonly SCALE_NORMAL;
    private readonly TWEEN_ACTION_COUNT;
    private readonly TWEEN_SWITCH_OVERHEAD;
    private readonly ICON_SPACE;
    private readonly BACKGROUND_PADDING_H;
    private readonly BACKGROUND_PADDING_V;
    /**
     * 構造函數注入 IToastView
     * @param view Toast View 實例
     */
    constructor(view: IToastView, logger: ILogger);
    /**
     * 獲取動畫總時長（毫秒）
     *
     * 包含基礎動畫時長 + Tween 切換開銷
     */
    getDuration(): number;
    /**
     * 設置最大時長限制
     */
    setMaxDuration(maxDuration: number): void;
    /**
     * 播放完整動畫
     *
     * @param message 顯示消息
     * @param iconPath 圖標路徑（可選，異步載入）
     * @param iconSpriteFrame 圖標 SpriteFrame（可選，直接使用，優先於 iconPath）
     * @param duration 顯示時長（毫秒），可選，預設使用 getDuration()
     * @param position 位置（top/center/bottom），預設 bottom
     * @param canvas Canvas 節點，用於添加 Toast
     * @returns Promise，動畫完成時 resolve
     */
    show(message: string, iconPath?: string, iconSpriteFrame?: SpriteFrame, duration?: number, position?: "top" | "center" | "bottom", canvas?: Node, iconColor?: Color): Promise<void>;
    /**
     * 立即隱藏 Toast（當新 Toast 出現時）
     */
    hide(): void;
    /**
     * 重置 Toast 狀態
     */
    reset(): void;
    /**
     * 圖標相對於文字高度的縮放比例（1.2 = 比文字高 20%）
     */
    private readonly ICON_HEIGHT_RATIO;
    /**
     * 設置圖標（優先使用 SpriteFrame，否則用路徑載入）
     *
     * @param background Label 組件（用於計算圖標位置和大小）
     * @param iconSprite 圖標 Sprite（可能為 null）
     * @param iconSpriteFrame 直接傳入的 SpriteFrame（優先使用）
     * @param iconPath 圖標路徑（當沒有 SpriteFrame 時使用）
     */
    private setIcon;
    /**
     * 設置圖標位置（在文字左側的空格區域內）
     */
    private positionIcon;
    /**
     * 更新底版尺寸（根據 Label 寬度自動縮放）
     *
     * ⭐ 所有元素保持 x = 0，不需要調整座標
     */
    private updateBackgroundSize;
    /**
     * 初始化狀態
     */
    private resetState;
    /**
     * 設置 Toast 位置
     */
    private setPosition;
    /**
     * 播放完整動畫序列（帶超時保護）
     */
    private playAnimationWithTimeout;
    /**
     * 清理資源
     */
    private cleanup;
    /**
     * 設置透明度（使用 color.a）
     */
    private setOpacity;
}
//# sourceMappingURL=ToastViewLogic.d.ts.map