import { AbstractDialogManager } from "./AbstractDialogManager";
import { DialogViewLogic } from "./DialogViewLogic";
import type { ILogger } from "../../core/Logger/ILogger";
import type { IDialogConfig } from "./IDialogConfig";
/**
 * 基於 Prefab 的 Dialog 管理器
 *
 * @example
 * ```typescript
 * // Bootstrap.ts
 * import { PrefabBasedDialogManager } from './bridge/types/uiCocos/Dialog';
 *
 * @property(Prefab)
 * dialogPrefab: Prefab = null!;
 *
 * async onLoad() {
 *   ServiceBridge.setCustomConfigure(() => {
 *     const { container, SERVICE_IDENTIFIERS } = window.ExternalModules;
 *     const logger = container.get(SERVICE_IDENTIFIERS.LOGGER);
 *
 *     const customDialog = new PrefabBasedDialogManager(logger, {
 *       dialogPrefab: this.dialogPrefab,
 *       poolCapacity: 1,
 *     });
 *
 *     container.rebind(SERVICE_IDENTIFIERS.DIALOG_MANAGER)
 *       .toConstantValue(customDialog);
 *   });
 *
 *   await initializeBridge();
 * }
 * ```
 */
export declare class PrefabBasedDialogManager extends AbstractDialogManager {
    private dialogPrefab;
    constructor(logger: ILogger, config: IDialogConfig);
    /**
     * 從 Prefab 創建 DialogViewLogic 實例
     */
    protected createDialogLogic(): DialogViewLogic;
    /**
     * 遞迴查找實現 IDialogView 的組件
     * 先在當前節點查找，再遞迴查找子節點
     */
    private findDialogView;
    /**
     * 驗證對象是否實現了 IDialogView 接口
     */
    private isValidDialogView;
}
//# sourceMappingURL=PrefabBasedDialogManager.d.ts.map