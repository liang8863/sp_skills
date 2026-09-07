import type { BaseNetworkError } from "../../core/Network/NetworkError";
/**
 * 强制退出服务
 *
 * 拦截特定 HTTP 错误（HTTP 403 + 业务 code 3003/3004），
 * 显示单按钮退出弹窗，玩家点击后通知 Host 退出游戏。
 *
 * 行为：
 * - 同次错误返回 "swallow"：呼叫端应将当前 request 永远 pending，不再 throw
 * - 已触发后续重复触发都返回 "swallow"，避免叠加弹窗
 * - 不属于强制退出条件返回 "pass"：呼叫端继续正常 throw
 */
export interface IForceExitService {
    /**
     * 检查并处理错误
     *
     * @param error 网路错误
     * @returns "swallow" 表示已接管（呼叫端不应再 throw）；"pass" 表示放行
     */
    handle(error: BaseNetworkError): "swallow" | "pass";
}
//# sourceMappingURL=IForceExitService.d.ts.map