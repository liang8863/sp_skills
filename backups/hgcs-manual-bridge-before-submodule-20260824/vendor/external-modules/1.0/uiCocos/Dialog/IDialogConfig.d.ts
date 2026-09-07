import { Prefab, Node } from "cc";
/**
 * PrefabBasedDialogManager 配置接口
 */
export interface IDialogConfig {
    /**
     * Dialog Prefab（必需）
     *
     * Prefab 根節點必須包含實現 IDialogView 接口的組件
     */
    dialogPrefab: Prefab;
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
     * const dialogManager = new PrefabBasedDialogManager(logger, {
     *   dialogPrefab: this.dialogPrefab,
     *   canvas: this.canvas.getChildByName('font'), // 使用 canvas/font/ 作為容器
     * });
     * ```
     */
    canvas?: Node;
    /**
     * 內建 Pool 容量
     *
     * 對象池最多緩存的 Dialog 實例數量
     *
     * 默認: 1
     */
    poolCapacity?: number;
    /**
     * Label 最大寬度（可選）
     *
     * 用於覆寫 DialogViewLogic 內建的 Label 寬度（預設 410px）。
     * 當訊息內容較長（特別是英文）時，內建 410px 可能導致換行到第三行。
     *
     * 使用時機：
     * - 英文長訊息顯示不下（文字被切到第三行）
     * - 希望 Dialog 寬度跟著 Label 擴大
     *
     * 設定範圍：
     * - 有效值：> 0
     * - 建議值：500 ~ 860（對應 Dialog 最終寬度 540 ~ 900）
     * - Dialog 最大寬度 900 = labelMaxWidth (<=860) + 左右內距 40
     *
     * 行為：
     * - 當 labelMaxWidth > 0：強制覆寫 Prefab 內的 Label contentSize.width
     * - 當未設定 / <= 0：維持原本邏輯（Prefab 寬度 > 0 則沿用，否則 fallback 410px）
     *
     * 默認: 0（不覆寫，使用 DialogViewLogic 內建邏輯）
     *
     * @example
     * ```typescript
     * // 需要容納「Are you sure you want to quit？」這類英文長句
     * new PrefabBasedDialogManager(logger, {
     *   dialogPrefab: this.dialogPrefab,
     *   labelMaxWidth: 560,
     * });
     * ```
     */
    labelMaxWidth?: number;
    /**
     * 按鈕水平間距（可選）
     *
     * 原本 DialogViewLogic 會根據 Dialog 寬度在 [10, 140] 之間自動伸縮按鈕間距，
     * 當 Dialog 因 labelMaxWidth 變寬時，按鈕會被推到兩側。
     *
     * 使用時機：
     * - 搭配 labelMaxWidth 一起使用，避免按鈕被加寬的 Dialog 推開
     * - 希望按鈕位置獨立於 Dialog 寬度，維持固定間距
     *
     * 行為：
     * - 當有設定（包含 0、負值）：強制使用這個固定間距，跳過自動伸縮
     * - 當未設定 / undefined：維持原本自動伸縮行為（[10, 140]）
     *
     * 默認: undefined（自動伸縮）
     *
     * @example
     * ```typescript
     * // Dialog 因 labelMaxWidth 變寬也不要讓按鈕被推開
     * new PrefabBasedDialogManager(logger, {
     *   dialogPrefab: this.dialogPrefab,
     *   labelMaxWidth: 420,
     *   buttonSpacing: 10,    // 按鈕固定間距 10，不受 Dialog 寬度影響
     * });
     * ```
     */
    buttonSpacing?: number;
}
//# sourceMappingURL=IDialogConfig.d.ts.map