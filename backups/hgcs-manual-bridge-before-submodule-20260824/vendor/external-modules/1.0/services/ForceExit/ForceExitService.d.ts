import type { IForceExitService } from "./IForceExitService";
import type { ILogger } from "../../core/Logger/ILogger";
import type { IDialogManager } from "../../uiCocos/Dialog/IDialogManager";
import type { IHostBridge } from "../../core/HostBridge/IHostBridge";
import { BaseNetworkError } from "../../core/Network/NetworkError";
/**
 * 强制退出服务实现
 *
 * 触发条件：HttpError && status === 403 && response.code ∈ {3003, 3004}
 * 触发后：显示单按钮弹窗 → 玩家按退出 → hostBridge.exitGame()
 *
 * 注意：依赖 DIALOG_MANAGER 和 HOST_BRIDGE，这两者由游戏项目在
 * ServiceBridge.addCustomConfigure() 中绑定，因此本服务采取 lazy 实例化
 * （首次 handle() 触发时才会被 Container 解析），届时依赖必定已就绪。
 */
export declare class ForceExitService implements IForceExitService {
    private logger;
    private dialogManager;
    private hostBridge;
    /** 是否已触发（避免重复弹窗） */
    private triggered;
    constructor(logger: ILogger, dialogManager: IDialogManager, hostBridge: IHostBridge);
    handle(error: BaseNetworkError): "swallow" | "pass";
    private shouldHandle;
}
//# sourceMappingURL=ForceExitService.d.ts.map