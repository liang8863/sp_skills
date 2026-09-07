import { IMaxMultiCapService, IMaxMultiCapHandleOptions } from "./IMaxMultiCapService";
import type { IAward } from "../../gameLogic/IAward";
import { IDialogManager } from "../../uiCocos/Dialog/IDialogManager";
/**
 * MaxMultiCapService
 *
 * 检查 awards 数组是否含有 MaxMultiCap 虚拟奖。
 * 若含有，弹出对话框通知玩家本局赢分已达上限，await 确定后返回 true。
 * 若不含，直接返回 false（no-op）。
 */
export declare class MaxMultiCapService implements IMaxMultiCapService {
    private readonly dialogManager;
    constructor(dialogManager: IDialogManager);
    handleIfPresent(awards: ReadonlyArray<IAward> | null | undefined, options?: IMaxMultiCapHandleOptions): Promise<boolean>;
}
//# sourceMappingURL=MaxMultiCapService.d.ts.map