import { ILogger } from "../Logger/ILogger";
import { IObjectPool, AnyPoolable } from "./IObjectPool";
/**
 * ObjectPool 實現
 *
 * 功能：
 * - 對象重用，減少創建銷毀開銷
 * - 容量管理，防止無限增長
 * - 統計信息，追蹤創建數量
 * - 預熱功能，提前準備對象
 *
 * 注意：ObjectPool 需要參數（factory, reset, maxSize），
 * 因此不適合直接綁定到 DI Container，應該通過 ObjectPoolManager 管理
 *
 * @template T 池中對象的類型（可以是任何類型，不強制實現 IPoolable）
 */
export declare class ObjectPool<T extends AnyPoolable = AnyPoolable> implements IObjectPool<T> {
    private logger;
    private pool;
    private factory;
    private reset?;
    private maxSize;
    private totalCreated;
    constructor(logger: ILogger, factory: () => T, reset?: (obj: T) => void, maxSize?: number);
    get(): T;
    put(obj: T): void;
    clear(): void;
    size(): number;
    getMaxSize(): number;
    setMaxSize(maxSize: number): void;
    getTotalCreated(): number;
    prewarm(count: number): void;
}
//# sourceMappingURL=ObjectPool.d.ts.map