import { Prefab, Node } from "cc";
/**
 * PrefabBasedToastManager 配置接口
 *
 * 用於配置基於 Prefab 的 Toast 管理器
 */
export interface IToastConfig {
    /**
     * Toast Prefab（必需）
     *
     * Prefab 根節點必須包含實現 IToastView 接口的組件
     */
    toastPrefab: Prefab;
    /**
     * Canvas 節點或容器節點（可選）
     *
     * 可以傳遞：
     * - Canvas 節點本身
     * - Canvas 的子節點（例如：canvas/game/、canvas/load/、canvas/font/ 等）
     *
     * 如果不提供，將自動查找場景中的 Canvas 並使用 Canvas 節點本身
     *
     * @example
     * ```typescript
     * // 使用 Canvas 的子節點作為容器
     * const toastManager = new PrefabBasedToastManager(logger, {
     *   toastPrefab: this.toastPrefab,
     *   canvas: this.canvas.getChildByName('game'), // 使用 canvas/game/ 作為容器
     * });
     * ```
     */
    canvas?: Node;
    /**
     * 最大顯示時長（毫秒）
     *
     * Toast 動畫時長如果超過此值，將被強制中斷
     *
     * 默認: 5000ms
     */
    maxDuration?: number;
    /**
     * 相同內容最小間隔（毫秒）
     *
     * 相同內容的 Toast 必須間隔此時間才能再次顯示
     * 用於防止用戶瘋狂點擊導致重複顯示
     *
     * 默認: 1000ms
     */
    minRepeatInterval?: number;
    /**
     * 同時顯示的 Toast 槽位數量
     *
     * 建議設置為 2，避免 ABABAB 快速循環時只顯示一種 Toast
     *
     * 默認: 2
     */
    slotCount?: number;
    /**
     * 內建 Pool 容量
     *
     * 對象池最多緩存的 Toast 實例數量
     *
     * 默認: 3
     */
    poolCapacity?: number;
}
//# sourceMappingURL=IToastConfig.d.ts.map