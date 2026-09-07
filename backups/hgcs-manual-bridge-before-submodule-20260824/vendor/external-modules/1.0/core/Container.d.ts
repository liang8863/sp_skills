/**
 * DI Container 配置
 *
 * 功能：
 * - 配置 InversifyJS Container
 * - 綁定所有服務（Logger、ToastManager 等）
 * - 提供基礎的服務取得方法
 *
 * 注意：
 * - 這是純粹的 DI Container，不包含高級初始化邏輯
 * - 高級功能（配置、初始化）由 ServiceBridge 負責
 */
import { Container } from "inversify";
/**
 * DI Container 實例
 */
export declare const container: Container;
/**
 * 取得服務實例（通用方法）
 *
 * @param identifier 服務標識符（SERVICE_IDENTIFIERS）
 * @returns 服務實例
 *
 * @example
 * ```typescript
 * const logger = getService<ILogger>(SERVICE_IDENTIFIERS.LOGGER);
 * const toastManager = getService<IToastManager>(SERVICE_IDENTIFIERS.TOAST_MANAGER);
 * ```
 */
export declare function getService<T>(identifier: symbol): T;
//# sourceMappingURL=Container.d.ts.map