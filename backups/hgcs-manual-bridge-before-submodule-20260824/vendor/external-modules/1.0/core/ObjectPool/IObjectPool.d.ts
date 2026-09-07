/**
 * ObjectPool 接口定義
 *
 * 對象池系統用於重用對象，減少創建和銷毀的開銷
 * 適用於頻繁創建和銷毀的對象（如 UI 元素、遊戲對象等）
 */
/**
 * 可池化對象接口
 *
 * 實現此接口的對象可以自定義重用和回收時的行為
 */
export interface IPoolable {
    /**
     * 對象從池中取出時調用（重用前）
     * 用於重置對象狀態，準備重用
     */
    onPoolReuse?(): void;
    /**
     * 對象放回池中時調用（回收時）
     * 用於清理對象狀態，準備回收
     */
    onPoolRecycle?(): void;
}
export type AnyPoolable = IPoolable | any;
/**
 * 對象池接口
 *
 * @template T 池中對象的類型（可以是任何類型，不強制實現 IPoolable）
 */
export interface IObjectPool<T extends AnyPoolable = AnyPoolable> {
    /**
     * 從池中獲取對象
     * 如果池為空，使用工廠函數創建新對象
     *
     * @returns 池中的對象或新創建的對象
     */
    get(): T;
    /**
     * 將對象放回池中
     * 會調用重置函數和 onPoolRecycle()
     *
     * @param obj 要放回的對象
     */
    put(obj: T): void;
    /**
     * 清空池中所有對象
     */
    clear(): void;
    /**
     * 獲取當前池中對象數量
     *
     * @returns 池中對象數量
     */
    size(): number;
    /**
     * 獲取池的最大容量
     *
     * @returns 最大容量
     */
    getMaxSize(): number;
    /**
     * 設置池的最大容量
     * 如果當前池大小超過新限制，會移除多餘對象
     *
     * @param maxSize 新的最大容量
     */
    setMaxSize(maxSize: number): void;
    /**
     * 獲取已創建的對象總數（用於統計）
     *
     * @returns 總創建數量
     */
    getTotalCreated(): number;
    /**
     * 預熱池（提前創建對象）
     * 用於在需要大量對象前提前準備
     *
     * @param count 預熱數量（不超過 maxSize）
     */
    prewarm(count: number): void;
}
//# sourceMappingURL=IObjectPool.d.ts.map