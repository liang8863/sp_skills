/**
 * ToastManager 接口定義
 *
 * 輕量級提示訊息系統（類似手機的 Toast）
 * 用於顯示臨時提示信息，自動消失
 */
import type { SpriteFrame, Color } from "cc";
export interface ToastOptions {
    /**
     * 顯示時長（毫秒），默認 2000ms
     */
    duration?: number;
    /**
     * 位置（top, center, bottom）
     */
    position?: "top" | "center" | "bottom";
    /**
     * 字體大小
     */
    fontSize?: number;
    /**
     * 圖標路徑（異步載入）
     */
    iconPath?: string;
    /**
     * 圖標 SpriteFrame（直接使用，優先於 iconPath）
     */
    iconSpriteFrame?: SpriteFrame;
    /**
     * 圖標顏色（可選，設置後會改變圖標 Sprite 的顏色）
     */
    iconColor?: Color;
}
export interface IToastManager {
    /**
     * 顯示提示訊息
     */
    show(message: string, options?: ToastOptions): void;
    /**
     * 清除所有 Toast
     */
    clear(): void;
}
//# sourceMappingURL=IToastManager.d.ts.map