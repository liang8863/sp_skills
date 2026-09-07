import { AbstractToastManager } from "./AbstractToastManager";
import { ToastViewLogic } from "./ToastViewLogic";
import type { ILogger } from "../../core/Logger/ILogger";
import type { IToastConfig } from "./IToastConfig";
/**
 * 基於 Prefab 的 Toast 管理器
 *
 * 使用替換模式：新 Toast 出現時，立即隱藏當前的 Toast
 *
 * @example
 * ```typescript
 * // Bootstrap.ts
 * import { PrefabBasedToastManager } from './bridge/types/uiCocos/Toast';
 *
 * @property(Prefab)
 * toastPrefab: Prefab = null!;
 *
 * async onLoad() {
 *   ServiceBridge.setCustomConfigure(() => {
 *     const { container, SERVICE_IDENTIFIERS } = window.ExternalModules;
 *     const logger = container.get(SERVICE_IDENTIFIERS.LOGGER);
 *
 *     const customToast = new PrefabBasedToastManager(logger, {
 *       toastPrefab: this.toastPrefab,
 *       maxDuration: 5000,
 *       minRepeatInterval: 1000,
 *       slotCount: 1,
 *       poolCapacity: 3,
 *     });
 *
 *     container.rebind(SERVICE_IDENTIFIERS.TOAST_MANAGER)
 *       .toConstantValue(customToast);
 *   });
 *
 *   await initializeBridge();
 * }
 * ```
 */
export declare class PrefabBasedToastManager extends AbstractToastManager {
    private toastPrefab;
    constructor(logger: ILogger, config: IToastConfig);
    /**
     * 從 Prefab 創建 ToastViewLogic 實例
     */
    protected createToastLogic(): ToastViewLogic;
    /**
     * 驗證對象是否實現了 IToastView 接口
     */
    private isValidToastView;
}
//# sourceMappingURL=PrefabBasedToastManager.d.ts.map