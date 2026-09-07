import { ILogger } from "../Logger/ILogger";
import { IObjectPoolManager, IPoolConfig, IPoolStats } from "./IObjectPoolManager";
import { IObjectPool, AnyPoolable } from "./IObjectPool";
/**
 * ObjectPoolManager 實現
 *
 * 統一管理所有對象池的中央管理器
 * 支持動態註冊，使用時才創建池
 *
 * 使用方式：
 * ```typescript
 * const poolManager = ServiceBridge.getObjectPoolManager();
 *
 * // 註冊池（動態註冊）
 * poolManager.registerPool('ToastLogic', {
 *   factory: () => new ToastViewLogic(...),
 *   reset: (logic) => logic.reset(),
 *   maxSize: 5,
 * });
 *
 * // 使用池
 * const logic = poolManager.get('ToastLogic');
 * poolManager.put('ToastLogic', logic);
 * ```
 */
export declare class ObjectPoolManager implements IObjectPoolManager {
    private logger;
    private pools;
    constructor(logger: ILogger);
    hasPool(type: string): boolean;
    registerPool<T extends AnyPoolable = AnyPoolable>(type: string, config: IPoolConfig<T>, overwrite?: boolean): void;
    getPool<T extends AnyPoolable = AnyPoolable>(type: string): IObjectPool<T>;
    get<T extends AnyPoolable = AnyPoolable>(type: string): T;
    put<T extends AnyPoolable = AnyPoolable>(type: string, obj: T): void;
    clear(type?: string): void;
    getStats(): Record<string, IPoolStats>;
}
//# sourceMappingURL=ObjectPoolManager.d.ts.map