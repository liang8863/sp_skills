import { Node } from "cc";
import type { IDialogView } from "./IDialogView";
import type { ILogger } from "../../core/Logger/ILogger";
/**
 * Dialog View 邏輯層（通過 DI 注入 View）
 *
 * 包含所有顯示邏輯，完全控制 Dialog 的業務邏輯
 * View 只負責提供 Cocos 組件的訪問
 *
 * 特點：
 * - 固定置中
 * - 無動畫
 * - 支持 1-2 個按鈕
 *
 * 注意：此類用於 ObjectPool，有 reset() 方法用於重置狀態
 */
export declare class DialogViewLogic {
    private view;
    private logger;
    private labelMaxWidth;
    private buttonSpacingOverride;
    private readonly BUTTON_HEIGHT;
    private readonly BUTTON_WIDTH;
    private readonly BUTTON_MARGIN_BOTTOM;
    private readonly TEXT_MARGIN_BOTTOM;
    private readonly TEXT_MARGIN_TOP;
    private readonly DIALOG_MAX_WIDTH;
    private readonly DIALOG_PADDING_H;
    private readonly BUTTON_SPACING_MIN;
    private readonly BUTTON_SPACING_MAX;
    /**
     * 計算 Dialog 最小寬度
     * 最小寬度 = 左右內距(20×2) + 按鈕寬度(200×2) + 按鈕最小間隔(10)
     */
    private get minDialogWidth();
    /**
     * 關閉回調（由 Manager 設置，用於通知 Manager Dialog 已關閉）
     */
    private onCloseCallback;
    /**
     * 構造函數注入 IDialogView
     * @param view Dialog View 實例
     * @param logger 日誌
     * @param labelMaxWidth Label 寬度覆寫值（>0 時覆寫 Prefab 和內建預設值）
     * @param buttonSpacingOverride 按鈕間距覆寫值（undefined=自動伸縮；有值=強制固定，允許 0 / 負值）
     */
    constructor(view: IDialogView, logger: ILogger, labelMaxWidth?: number, buttonSpacingOverride?: number | undefined);
    /**
     * 設置關閉回調（由 Manager 調用）
     */
    setOnCloseCallback(callback: () => void): void;
    /**
     * 顯示 Dialog
     *
     * @param message 顯示消息
     * @param confirmButtonText 確認按鈕文字（可選）
     * @param onConfirm 確認按鈕回調（可選）
     * @param cancelButtonText 取消按鈕文字（可選）
     * @param onCancel 取消按鈕回調（可選，點擊取消按鈕或黑底時執行）
     * @param canvas Canvas 節點，用於添加 Dialog
     */
    show(message: string, confirmButtonText: string | undefined, onConfirm: (() => void) | undefined, cancelButtonText: string | undefined, onCancel: (() => void) | undefined, canvas: Node): void;
    /**
     * 關閉 Dialog
     */
    close(): void;
    /**
     * 重置 Dialog 狀態
     */
    reset(): void;
    /**
     * 統一的取消處理方法（黑底遮罩和取消按鈕共用）
     */
    private handleCancel;
    /**
     * 智能佈局：根據內容動態調整 Dialog 大小和位置
     *
     * 佈局規則（從下往上）：
     * 1. 底部留白：30
     * 2. 按鈕高度：70
     * 3. 按鈕與文字間距：30
     * 4. 文字高度：動態
     * 5. 頂部留白：30
     *
     * 寬度規則：
     * - 最小寬度：由左右內距 + 按鈕寬度×2 + 按鈕最小間隔計算
     * - 最大寬度：900
     * - 按鈕間隔：根據 Dialog 寬度自動調整 (10~140)
     *
     * 總高度 = 30 + 70 + 30 + labelHeight + 30
     */
    private updateDialogLayout;
    /**
     * 設置按鈕（簡化為確認/取消）
     */
    private setupButtons;
}
//# sourceMappingURL=DialogViewLogic.d.ts.map