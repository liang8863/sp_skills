/**
 * DialogManager 接口定义
 *
 * 对话框管理系统
 * 用于显示各类弹窗（确认框、提示框等）
 */
export interface DialogOptions {
    /**
     * 内容消息
     */
    message: string;
    /**
     * 确认按钮文字
     * 如果不提供，则不显示确认按钮
     */
    confirmButtonText?: string;
    /**
     * 确认按钮回调
     */
    onConfirm?: () => void;
    /**
     * 取消按钮文字
     * 如果不提供，则不显示取消按钮
     */
    cancelButtonText?: string;
    /**
     * 取消按钮回调（点击取消按钮或黑底遮罩时执行）
     */
    onCancel?: () => void;
}
/**
 * Promise 化对话框选项
 *
 * 用于 confirmAsync()，将回调式 API 封装为 Promise
 */
export interface IConfirmAsyncOptions {
    /**
     * 对话框内容消息
     */
    message: string;
    /**
     * 对话框标题（可选）
     */
    title?: string;
    /**
     * 确认按钮文字（可选，不传则使用默认文字）
     */
    confirmText?: string;
    /**
     * 取消按钮文字（可选，不传则使用默认文字）
     */
    cancelText?: string;
    /**
     * 是否显示取消按钮
     * 默认 true；MaxMultiCap 场景传 false（仅显示确认按钮）
     */
    showCancel?: boolean;
}
export interface IDialogManager {
    /**
     * 显示对话框
     */
    show(options: DialogOptions): void;
    /**
     * 关闭当前对话框
     */
    close(): void;
    /**
     * Promise 化对话框
     *
     * showCancel === false 时：仅显示确认按钮，resolve(true)
     * showCancel === true（默认）时：确认 resolve(true)，取消 resolve(false)
     */
    confirmAsync(opts: IConfirmAsyncOptions): Promise<boolean>;
}
//# sourceMappingURL=IDialogManager.d.ts.map