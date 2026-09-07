/**
 * LoadingManager 接口定義
 *
 * 載入畫面管理系統
 * 用於顯示遊戲載入進度
 *
 * 支持多實例管理（Registry Pattern）：
 * - 默認實例：構造函數中自動註冊（key: "default"）
 * - 命名實例：通過 register() 動態註冊
 * - 所有方法支持可選的 key 參數（不傳則使用默認實例）
 */
import type { ILoadingConfig } from "./ILoadingConfig";
export interface LoadingOptions {
    /**
     * 初始提示文字
     */
    initialTip?: string;
}
export interface ILoadingManager {
    /**
     * 註冊新的 Loading 實例
     *
     * @param key 實例的唯一標識符
     * @param config Loading 配置
     * @param overwrite 是否允許覆蓋已存在的實例（默認：false）
     *
     * @example
     * ```typescript
     * // 註冊遊戲面板 Loading
     * manager.register('game-panel', {
     *   loadingView: gamePanelLoadingView,
     * });
     *
     * // 覆蓋已存在的實例
     * manager.register('game-panel', newConfig, true);
     * ```
     */
    register(key: string, config: ILoadingConfig, overwrite?: boolean): void;
    /**
     * 檢查實例是否存在
     *
     * @param key 實例 key
     * @returns 存在返回 true
     *
     * @example
     * ```typescript
     * if (manager.hasInstance('game-panel')) {
     *   manager.show(null, 'game-panel');
     * }
     * ```
     */
    hasInstance(key: string): boolean;
    /**
     * 顯示載入畫面
     *
     * @param options Loading 選項
     * @param key 實例 key（默認：DEFAULT_KEY）
     *
     * @example
     * ```typescript
     * // 使用默認實例
     * manager.show({ initialTip: "載入中..." });
     *
     * // 使用命名實例
     * manager.show({ initialTip: "載入遊戲..." }, 'game-panel');
     * ```
     */
    show(options?: LoadingOptions, key?: string): void;
    /**
     * 隱藏載入畫面
     *
     * @param key 實例 key（默認：DEFAULT_KEY）
     *
     * @example
     * ```typescript
     * // 隱藏默認實例
     * manager.hide();
     *
     * // 隱藏命名實例
     * manager.hide('game-panel');
     * ```
     */
    hide(key?: string): void;
    /**
     * 更新進度
     *
     * @param progress 進度值 (0-100)
     * @param tip 提示文字（可選）
     * @param key 實例 key（默認：DEFAULT_KEY）
     *
     * @example
     * ```typescript
     * // 更新默認實例
     * manager.updateProgress(50, "載入資源...");
     *
     * // 更新命名實例
     * manager.updateProgress(75, "載入完成", 'game-panel');
     * ```
     */
    updateProgress(progress: number, tip?: string, key?: string): void;
    /**
     * 顯示錯誤訊息
     *
     * @param message 錯誤訊息
     * @param key 實例 key（默認：DEFAULT_KEY）
     *
     * @example
     * ```typescript
     * // 默認實例顯示錯誤
     * manager.showError("載入失敗");
     *
     * // 命名實例顯示錯誤
     * manager.showError("遊戲載入失敗", 'game-panel');
     * ```
     */
    showError(message: string, key?: string): void;
    /**
     * 重置載入狀態
     *
     * @param key 實例 key（默認：DEFAULT_KEY）
     *
     * @example
     * ```typescript
     * // 重置默認實例
     * manager.reset();
     *
     * // 重置命名實例
     * manager.reset('game-panel');
     * ```
     */
    reset(key?: string): void;
}
//# sourceMappingURL=ILoadingManager.d.ts.map