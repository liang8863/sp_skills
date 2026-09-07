import { IObjectPool, AnyPoolable } from "./IObjectPool";
/**
 * 對象池配置
 *
 * @template T 池中對象的類型
 */
export interface IPoolConfig<T extends AnyPoolable = AnyPoolable> {
    /**
     * 對象工廠函數（用於創建新對象）
     */
    factory: () => T;
    /**
     * 重置函數（對象放回池時調用，用於清理狀態）
     */
    reset?: (obj: T) => void;
    /**
     * 最大容量（默認 10）
     */
    maxSize?: number;
    /**
     * 預熱數量（註冊時預先創建的對象數量，可選）
     */
    prewarm?: number;
}
/**
 * 池統計信息
 */
export interface IPoolStats {
    /**
     * 當前池中對象數量
     */
    size: number;
    /**
     * 已創建的對象總數
     */
    totalCreated: number;
    /**
     * 最大容量
     */
    maxSize: number;
}
/**
 * ObjectPoolManager 接口
 *
 * 統一管理所有對象池的中央管理器
 * 支持動態註冊，使用時才創建池
 */
export interface IObjectPoolManager {
    /**
     * 檢查指定類型的池是否存在
     *
     * @param type 池的類型標識（例如：'ToastLogic', 'DialogLogic'）
     * @returns 是否存在
     */
    hasPool(type: string): boolean;
    /**
     * 註冊一個對象池
     * 如果池已存在且 overwrite=false，會跳過註冊並記錄警告
     *
     * @param type 池的類型標識
     * @param config 池配置
     * @param overwrite 是否允許覆蓋已存在的池（默認 false）
     */
    registerPool<T extends AnyPoolable = AnyPoolable>(type: string, config: IPoolConfig<T>, overwrite?: boolean): void;
    /**
     * 獲取指定類型的對象池
     * 如果池不存在，會拋出錯誤
     *
     * @param type 池的類型標識
     * @returns 對象池實例
     * @throws 如果池未註冊
     */
    getPool<T extends AnyPoolable = AnyPoolable>(type: string): IObjectPool<T>;
    /**
     * 從指定類型的池中獲取對象
     * 如果池不存在，會拋出錯誤
     *
     * @param type 池的類型標識
     * @returns 對象實例
     * @throws 如果池未註冊
     */
    get<T extends AnyPoolable = AnyPoolable>(type: string): T;
    /**
     * 將對象放回指定類型的池中
     * 如果池不存在，會記錄警告並丟棄對象
     *
     * @param type 池的類型標識
     * @param obj 對象
     */
    put<T extends AnyPoolable = AnyPoolable>(type: string, obj: T): void;
    /**
     * 清空指定類型的池
     * 如果不提供 type，則清空所有池
     *
     * @param type 池的類型標識（可選）
     */
    clear(type?: string): void;
    /**
     * 獲取所有池的統計信息
     *
     * @returns 統計信息對象，key 為池類型，value 為統計信息
     */
    getStats(): Record<string, IPoolStats>;
}
//# sourceMappingURL=IObjectPoolManager.d.ts.map