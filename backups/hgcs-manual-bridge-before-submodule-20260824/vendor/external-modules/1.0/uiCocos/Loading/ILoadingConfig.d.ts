/**
 * LoadingManager 配置接口
 */
import type { Prefab } from "cc";
import type { ILoadingView } from "./ILoadingView";
import type { AbstractLoadingViewLogic } from "./AbstractLoadingViewLogic";
import type { ILogger } from "../../core/Logger/ILogger";
export interface ILoadingConfig {
    /**
     * 方式 1：提供 Prefab（動態創建）
     */
    loadingPrefab?: Prefab;
    /**
     * 方式 2：提供場景節點（直接使用）
     */
    loadingView?: ILoadingView;
    /**
     * 當使用 loadingPrefab 時，指定 View 組件類型
     * 如果不提供，會自動查找實現 ILoadingView 的組件
     */
    viewComponentType?: any;
    /**
     * 自定義 Logic 類型（可選，默認使用 LoadingViewLogic）
     *
     * 如需自定義 Loading 行為，可以繼承 AbstractLoadingViewLogic 並傳入
     *
     * @example
     * ```typescript
     * class MyLoadingLogic extends AbstractLoadingViewLogic {
     *   show(message?: string): void {
     *     // 自定義顯示動畫
     *     super.show(message);
     *     this.playShowAnimation();
     *   }
     * }
     *
     * const config: ILoadingConfig = {
     *   loadingView: myView,
     *   logicType: MyLoadingLogic  // 使用自定義 Logic
     * };
     * ```
     */
    logicType?: new (view: ILoadingView, logger: ILogger) => AbstractLoadingViewLogic;
}
//# sourceMappingURL=ILoadingConfig.d.ts.map