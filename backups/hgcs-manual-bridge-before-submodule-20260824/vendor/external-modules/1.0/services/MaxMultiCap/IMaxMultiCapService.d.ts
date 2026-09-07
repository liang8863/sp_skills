/**
 * 倍率上限服务接口
 *
 * 用于检查 spin response 的 awards 数组中是否含有 MaxMultiCap 虚拟奖，
 * 若有则弹出对话框通知玩家，await 确定后继续流程。
 */
import type { IAward } from "../../gameLogic/IAward";
export interface IMaxMultiCapHandleOptions {
    /** 实际派彩金额，会替换 i18n 文案中的 {amount} 占位符。可传 string（已格式化）或 number。 */
    winAmount?: string | number;
}
export interface IMaxMultiCapService {
    /**
     * 检查 awards 中是否含 MaxMultiCap 虚拟奖。
     * - 含：弹 Dialog 显示上限值，await 玩家点确定，回 true
     * - 不含：立即回 false（no-op）
     */
    handleIfPresent(awards: ReadonlyArray<IAward> | null | undefined, options?: IMaxMultiCapHandleOptions): Promise<boolean>;
}
//# sourceMappingURL=IMaxMultiCapService.d.ts.map