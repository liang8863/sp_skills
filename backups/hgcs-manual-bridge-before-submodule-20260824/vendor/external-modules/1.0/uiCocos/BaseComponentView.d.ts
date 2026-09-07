import { Component } from "cc";
/**
 * 基礎 Component View 類
 *
 * 職責：
 * - 提供 Cocos 調度功能（scheduleOnce、schedule、unschedule）
 * - 提供 update 回調註冊機制（可選）
 * - 自動資源清理
 *
 * 設計理念：
 * - 所有 View 組件統一繼承此基類
 * - 按需使用功能，未使用功能幾乎無性能開銷
 * - 避免在每個 View 中重複實現相同邏輯
 *
 * 使用範例：
 * ```typescript
 * @ccclass("CustomView")
 * export class CustomView extends BaseComponentView implements ICustomView {
 *   onLoad() {
 *     // 使用 Schedule 功能
 *     this.scheduleOnceCallback(() => {
 *       console.log("延遲執行");
 *     }, 2);
 *
 *     // 使用 Update 功能（可選）
 *     this.registerUpdate((dt) => {
 *       console.log("每幀執行");
 *     });
 *   }
 * }
 * ```
 */
export declare abstract class BaseComponentView extends Component {
    /**
     * 延遲執行一次（封裝 Cocos scheduleOnce）
     * @param callback 回調函數
     * @param delay 延遲時間（秒）
     *
     * 注意事項：
     * - 使用此方法而非直接調用 super.scheduleOnce()
     * - 組件銷毀時會自動清理
     */
    scheduleOnceCallback(callback: () => void, delay: number): void;
    /**
     * 重複執行（封裝 Cocos schedule）
     * @param callback 回調函數（接收 dt 參數）
     * @param interval 間隔時間（秒）
     * @param repeat 重複次數（默認 cc.macro.REPEAT_FOREVER）
     * @param delay 首次執行延遲（秒，默認 0）
     *
     * 注意事項：
     * - 組件銷毀時會自動清理
     */
    scheduleCallback(callback: (dt: number) => void, interval: number, repeat?: number, delay?: number): void;
    /**
     * 取消指定回調
     * @param callback 要取消的回調函數
     */
    unscheduleCallback(callback: Function): void;
    /**
     * 取消所有調度回調
     *
     * 注意事項：
     * - 組件銷毀時會自動調用
     * - 手動調用此方法會清除所有 schedule 和 scheduleOnce
     */
    unscheduleAllCallbacks(): void;
    /**
     * 儲存所有註冊的 update 回調
     */
    private updateCallbacks;
    /**
     * 註冊 update 回調（每幀執行）
     * @param callback update 回調函數，接收 dt（幀間隔時間）參數
     *
     * 使用場景：
     * - 需要逐幀更新的邏輯（如動畫、物理模擬等）
     * - Logic 層需要 update 功能時，透過此方法註冊
     *
     * 注意事項：
     * - 同一個回調函數只會註冊一次（Set 自動去重）
     * - 組件銷毀時會自動清理
     */
    registerUpdate(callback: (dt: number) => void): void;
    /**
     * 取消註冊 update 回調
     * @param callback 要取消的回調函數
     */
    unregisterUpdate(callback: (dt: number) => void): void;
    /**
     * 清空所有 update 回調
     */
    clearAllUpdateCallbacks(): void;
    /**
     * Cocos update 生命週期（每幀執行）
     * @param dt 幀間隔時間（秒）
     *
     * 性能說明：
     * - 如果沒有註冊任何回調，只執行一次 if 判斷（約 0.0001ms）
     * - 如果有註冊回調，則執行所有回調邏輯
     */
    protected update(dt: number): void;
    /**
     * 組件銷毀時自動清理所有資源
     *
     * 清理內容：
     * - 所有 Schedule 調度（scheduleOnce、schedule）
     * - 所有 Update 回調
     *
     * 注意事項：
     * - 子類如果覆寫 onDestroy，必須調用 super.onDestroy()
     */
    protected onDestroy(): void;
}
//# sourceMappingURL=BaseComponentView.d.ts.map