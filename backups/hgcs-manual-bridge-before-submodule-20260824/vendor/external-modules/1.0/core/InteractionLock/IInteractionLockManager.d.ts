/**
 * 交互鎖管理器接口
 *
 * 用於管理所有用戶交互的鎖定狀態，防止連點和並發操作
 */
export interface IInteractionLockManager {
    /**
     * 檢查指定鍵是否被鎖定
     *
     * @param key - 鎖的唯一標識（通常是動作類型）
     * @returns 是否被鎖定
     *
     * @example
     * ```ts
     * if (lockManager.isLocked('spin')) {
     *   console.log('Spin is locked');
     * }
     * ```
     */
    isLocked(key: string): boolean;
    /**
     * 鎖定指定鍵
     *
     * @param key - 鎖的唯一標識
     * @param duration - 鎖定時長（毫秒），0 表示需要手動解鎖，Infinity 表示永久鎖定
     *
     * @example
     * ```ts
     * // 鎖定 300 毫秒（自動解鎖）
     * lockManager.lock('spin', 300);
     *
     * // 手動鎖定（需要手動解鎖）
     * lockManager.lock('spin', 0);
     *
     * // 永久鎖定
     * lockManager.lock('spin', Infinity);
     * ```
     */
    lock(key: string, duration?: number): void;
    /**
     * 解鎖指定鍵
     *
     * @param key - 鎖的唯一標識
     *
     * @example
     * ```ts
     * lockManager.unlock('spin');
     * ```
     */
    unlock(key: string): void;
    /**
     * 檢查全局是否被鎖定
     *
     * 全局鎖定時，所有動作都無法執行
     *
     * @returns 是否全局鎖定
     *
     * @example
     * ```ts
     * if (lockManager.isGlobalLocked()) {
     *   console.log('All actions are locked');
     * }
     * ```
     */
    isGlobalLocked(): boolean;
    /**
     * 鎖定全局
     *
     * 鎖定後，所有動作都無法執行
     *
     * @example
     * ```ts
     * // 遊戲載入時鎖定全局
     * lockManager.lockGlobal();
     * ```
     */
    lockGlobal(): void;
    /**
     * 解鎖全局
     *
     * @example
     * ```ts
     * // 遊戲載入完成後解鎖全局
     * lockManager.unlockGlobal();
     * ```
     */
    unlockGlobal(): void;
    /**
     * 獲取指定鍵的剩餘冷卻時間
     *
     * @param key - 鎖的唯一標識
     * @returns 剩餘冷卻時間（毫秒），0 表示未鎖定
     *
     * @example
     * ```ts
     * const remaining = lockManager.getCooldown('spin');
     * console.log(`Spin cooldown: ${remaining}ms`);
     * ```
     */
    getCooldown(key: string): number;
    /**
     * 清除所有鎖
     *
     * 通常用於遊戲重置或錯誤恢復
     *
     * @example
     * ```ts
     * // 遊戲發生錯誤時清除所有鎖
     * lockManager.clearAll();
     * ```
     */
    clearAll(): void;
    /**
     * 清除指定鍵的鎖
     *
     * 與 unlock 相同，只是語義更明確
     *
     * @param key - 鎖的唯一標識
     */
    clear(key: string): void;
}
//# sourceMappingURL=IInteractionLockManager.d.ts.map