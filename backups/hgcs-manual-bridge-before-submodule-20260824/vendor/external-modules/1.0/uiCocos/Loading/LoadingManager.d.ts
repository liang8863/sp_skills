import type { ILogger } from "../../core/Logger/ILogger";
import type { ILoadingManager, LoadingOptions } from "./ILoadingManager";
import type { ILoadingConfig } from "./ILoadingConfig";
/**
 * Loading 管理器（支持多實例 Registry Pattern）
 *
 * 支持兩種配置方式：
 * 1. 提供場景節點（loadingView）- 直接使用
 * 2. 提供 Prefab（loadingPrefab）- 動態創建
 *
 * 支持自定義 Logic：
 * - 提供 logicType - 使用自定義 Logic 實現
 * - 不提供 - 使用默認 LoadingViewLogic
 *
 * 多實例管理：
 * - 默認實例：構造函數中自動註冊（key: "default"）
 * - 命名實例：通過 register() 動態註冊
 * - 所有方法支持可選的 key 參數（不傳則使用默認實例）
 *
 * @example
 * ```typescript
 * // 方式 1：使用場景節點（默認實例）
 * const loadingManager = new LoadingManager(logger, {
 *   loadingView: this.loadingView,  // 場景中的組件
 * });
 * loadingManager.show(); // 使用默認實例
 *
 * // 方式 2：註冊多個實例
 * loadingManager.register('game-panel', {
 *   loadingView: gamePanelLoadingView,
 * });
 * loadingManager.show(null, 'game-panel'); // 使用命名實例
 *
 * // 方式 3：使用 Prefab
 * loadingManager.register('mini-game', {
 *   loadingPrefab: this.loadingPrefab,
 *   viewComponentType: CustomLoadingView,
 * });
 *
 * // 方式 4：使用自定義 Logic
 * loadingManager.register('custom', {
 *   loadingView: this.loadingView,
 *   logicType: MyCustomLoadingLogic,  // 繼承 AbstractLoadingViewLogic
 * });
 * ```
 */
export declare class LoadingManager implements ILoadingManager {
    private logger;
    /**
     * 實例存儲（Registry Pattern）
     * Map<key, LoadingInstance>
     */
    private instances;
    /**
     * 默認實例 key
     */
    private readonly DEFAULT_KEY;
    /**
     * 共享的 Canvas 節點（跨所有實例）
     */
    private canvas;
    constructor(logger: ILogger, defaultConfig: ILoadingConfig);
    /**
     * 註冊新的 Loading 實例
     */
    register(key: string, config: ILoadingConfig, overwrite?: boolean): void;
    /**
     * 檢查實例是否存在
     */
    hasInstance(key: string): boolean;
    /**
     * 顯示載入畫面
     */
    show(options?: LoadingOptions, key?: string): void;
    /**
     * 隱藏載入畫面
     */
    hide(key?: string): void;
    /**
     * 更新進度（0-100）
     */
    updateProgress(progress: number, tip?: string, key?: string): void;
    /**
     * 顯示錯誤訊息
     */
    showError(message: string, key?: string): void;
    /**
     * 重置載入狀態
     */
    reset(key?: string): void;
    /**
     * 獲取實例（內部輔助方法）
     * @param key 實例 key（可選，默認使用 DEFAULT_KEY）
     * @returns LoadingInstance 或 null（優雅降級）
     */
    private getInstance;
    /**
     * 確保實例已初始化（延遲初始化）
     * @param instance LoadingInstance
     */
    private ensureInitialized;
    /**
     * 安全獲取 Canvas 節點（與 Toast/Dialog 一致）
     * Canvas 跨所有實例共享
     */
    private getCanvasSafely;
    /**
     * 驗證對象是否實現了 ILoadingView 接口
     */
    private isValidLoadingView;
}
//# sourceMappingURL=LoadingManager.d.ts.map