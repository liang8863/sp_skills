import { Component } from "cc";
import { ServiceBridge } from "../ServiceBridge";
import type { ILogger } from "../types/core";

/**
 * 基础 Component View 类
 *
 * 职责：
 * - 提供 Cocos 调度功能（scheduleOnce、schedule、unschedule）
 * - 提供 update 回调注册机制（可选）
 * - 自动资源清理
 *
 * 设计理念：
 * - 所有 View 组件统一继承此基类
 * - 按需使用功能，未使用功能几乎无性能开销
 * - 避免在每个 View 中重复实现相同逻辑
 *
 * 使用范例：
 * ```typescript
 * @ccclass("CustomView")
 * export class CustomView extends BaseComponentView implements ICustomView {
 *   onLoad() {
 *     // 使用 Schedule 功能
 *     this.scheduleOnceCallback(() => {
 *       console.log("延迟执行");
 *     }, 2);
 *
 *     // 使用 Update 功能（可选）
 *     this.registerUpdate((dt) => {
 *       console.log("每帧执行");
 *     });
 *   }
 * }
 * ```
 */
export abstract class BaseComponentView extends Component {
  private logger: ILogger | null = null;

  /**
   * 获取 Logger（简化版，ServiceBridge.getLogger() 已支持 Proxy 自动切换）
   */
  protected getLogger() {
    if (!this.logger) {
      this.logger = ServiceBridge.getLogger();
    }
    return this.logger;
  }

  // ========== Schedule 功能 ==========

  /**
   * 延迟执行一次（封装 Cocos scheduleOnce）
   * @param callback 回调函数
   * @param delay 延迟时间（秒）
   *
   * 注意事项：
   * - 使用此方法而非直接调用 super.scheduleOnce()
   * - 组件销毁时会自动清理
   */
  public scheduleOnceCallback(callback: () => void, delay: number): void {
    super.scheduleOnce(callback, delay);
  }

  /**
   * 重复执行（封装 Cocos schedule）
   * @param callback 回调函数（接收 dt 参数）
   * @param interval 间隔时间（秒）
   * @param repeat 重复次数（默认 cc.macro.REPEAT_FOREVER）
   * @param delay 首次执行延迟（秒，默认 0）
   *
   * 注意事项：
   * - 组件销毁时会自动清理
   */
  public scheduleCallback(
    callback: (dt: number) => void,
    interval: number,
    repeat?: number,
    delay?: number
  ): void {
    super.schedule(callback, interval, repeat, delay);
  }

  /**
   * 取消指定回调
   * @param callback 要取消的回调函数
   */
  public unscheduleCallback(callback: Function): void {
    super.unschedule(callback);
  }

  /**
   * 取消所有调度回调
   *
   * 注意事项：
   * - 组件销毁时会自动调用
   * - 手动调用此方法会清除所有 schedule 和 scheduleOnce
   */
  public unscheduleAllCallbacks(): void {
    super.unscheduleAllCallbacks();
  }

  // ========== Update 注册机制 ==========

  /**
   * 储存所有注册的 update 回调
   */
  private updateCallbacks: Set<(dt: number) => void> = new Set();

  /**
   * 注册 update 回调（每帧执行）
   * @param callback update 回调函数，接收 dt（帧间隔时间）参数
   *
   * 使用场景：
   * - 需要逐帧更新的逻辑（如动画、物理模拟等）
   * - Logic 层需要 update 功能时，透过此方法注册
   *
   * 注意事项：
   * - 同一个回调函数只会注册一次（Set 自动去重）
   * - 组件销毁时会自动清理
   */
  public registerUpdate(callback: (dt: number) => void): void {
    this.updateCallbacks.add(callback);
  }

  /**
   * 取消注册 update 回调
   * @param callback 要取消的回调函数
   */
  public unregisterUpdate(callback: (dt: number) => void): void {
    this.updateCallbacks.delete(callback);
  }

  /**
   * 清空所有 update 回调
   */
  public clearAllUpdateCallbacks(): void {
    this.updateCallbacks.clear();
  }

  /**
   * Cocos update 生命周期（每帧执行）
   * @param dt 帧间隔时间（秒）
   *
   * 性能说明：
   * - 如果没有注册任何回调，只执行一次 if 判断（约 0.0001ms）
   * - 如果有注册回调，则执行所有回调逻辑
   */
  protected update(dt: number): void {
    // 只在有注册回调时才执行
    if (this.updateCallbacks.size > 0) {
      this.updateCallbacks.forEach((callback) => {
        try {
          callback(dt);
        } catch (error) {
          this.getLogger().error(
            "[BaseComponentView] Update 回调执行失败",
            error
          );
        }
      });
    }
  }

  // ========== 生命周期管理 ==========

  /**
   * 组件销毁时自动清理所有资源
   *
   * 清理内容：
   * - 所有 Schedule 调度（scheduleOnce、schedule）
   * - 所有 Update 回调
   *
   * 注意事项：
   * - 子类如果覆写 onDestroy，必须调用 super.onDestroy()
   */
  protected onDestroy(): void {
    // 清理所有 Schedule
    this.unscheduleAllCallbacks();

    // 清理所有 Update 回调
    this.updateCallbacks.clear();
  }
}
