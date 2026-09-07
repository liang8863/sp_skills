/**
 * EventBridge - 事件管理桥接器
 *
 * 提供自动管理事件生命周期的功能
 * 当 Cocos 组件销毁时，自动清理所有注册的事件监听器
 *
 * 使用方式：
 * ```typescript
 * class MyController extends Component {
 *   private events = new EventBridge(this.node);
 *
 *   onLoad() {
 *     this.events.on('game:start', this.handleGameStart, this);
 *   }
 *
 *   onDestroy() {
 *     // 自动清理所有事件
 *     this.events.destroy();
 *   }
 * }
 * ```
 */

import { Node } from "cc";
import { ServiceBridge } from "./ServiceBridge";
import type { EventListener, IEventSystem } from "./types/core";
import { GameConfig } from "../config/GameConfig";

/**
 * 事件监听器记录
 */
interface EventListenerRecord {
  event: string;
  callback: EventListener;
  context?: any;
  once: boolean;
}

/**
 * EventBridge 实例类
 */
export class EventBridge {
  private eventSystem: IEventSystem;
  private listeners: EventListenerRecord[] = [];
  private _isDestroyed = false;
  private node: Node | null = null;

  /**
   * 构造函数
   * @param node - Cocos 节点（可选，用于自动绑定节点销毁事件）
   */
  constructor(node?: Node) {
    this.eventSystem = ServiceBridge.getEventSystem();

    if (node) {
      this.node = node;
      this.bindNodeDestroy();
    }

    this.log("[EventBridge] 创建实例");
  }

  /**
   * 监听事件
   */
  on(event: string, callback: EventListener, context?: any): void {
    if (this._isDestroyed) {
      ServiceBridge.getLogger().warn("[EventBridge] 实例已销毁，无法注册事件");
      return;
    }

    // 注册到 EventSystem
    this.eventSystem.on(event, callback, context);

    // 记录监听器
    this.listeners.push({
      event,
      callback,
      context,
      once: false,
    });

    this.logEvent("on", event);
  }

  /**
   * 监听事件（仅一次）
   */
  once(event: string, callback: EventListener, context?: any): void {
    if (this._isDestroyed) {
      ServiceBridge.getLogger().warn("[EventBridge] 实例已销毁，无法注册事件");
      return;
    }

    // 包装 callback，执行后自动从记录中移除
    const wrappedCallback: EventListener = (data) => {
      callback.call(context, data);

      // 从记录中移除
      const index = this.listeners.findIndex(
        (l) => l.event === event && l.callback === wrappedCallback
      );
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };

    // 注册到 EventSystem
    this.eventSystem.once(event, wrappedCallback, context);

    // 记录监听器
    this.listeners.push({
      event,
      callback: wrappedCallback,
      context,
      once: true,
    });

    this.logEvent("once", event);
  }

  /**
   * 取消监听事件
   */
  off(event: string, callback?: EventListener, context?: any): void {
    if (this._isDestroyed) {
      return;
    }

    // 从 EventSystem 取消监听
    this.eventSystem.off(event, callback, context);

    // 从记录中移除
    if (callback) {
      // 移除特定的监听器
      const index = this.listeners.findIndex(
        (l) =>
          l.event === event && l.callback === callback && l.context === context
      );
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    } else {
      // 移除该事件的所有监听器
      this.listeners = this.listeners.filter((l) => l.event !== event);
    }

    this.logEvent("off", event);
  }

  /**
   * 触发事件
   */
  emit(event: string, data?: unknown): void {
    if (this._isDestroyed) {
      ServiceBridge.getLogger().warn("[EventBridge] 实例已销毁，无法触发事件");
      return;
    }

    this.eventSystem.emit(event, data);
    this.logEvent("emit", event, data);
  }

  /**
   * 清除事件
   */
  clear(event?: string): void {
    if (this._isDestroyed) {
      return;
    }

    if (event) {
      // 清除特定事件
      this.listeners
        .filter((l) => l.event === event)
        .forEach((l) => {
          this.eventSystem.off(l.event, l.callback, l.context);
        });

      this.listeners = this.listeners.filter((l) => l.event !== event);
      this.logEvent("clear", event);
    } else {
      // 清除所有事件
      this.clearAll();
    }
  }

  /**
   * 清除所有事件监听器
   */
  clearAll(): void {
    if (this._isDestroyed) {
      return;
    }

    this.log(`[EventBridge] 清除所有事件监听器 (${this.listeners.length} 个)`);

    // 从 EventSystem 取消所有监听
    this.listeners.forEach((listener) => {
      this.eventSystem.off(listener.event, listener.callback, listener.context);
    });

    // 清空记录
    this.listeners = [];
  }

  /**
   * 销毁 EventBridge
   * 自动清除所有事件监听器
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    this.log("[EventBridge] 销毁实例");

    // 清除所有事件
    this.clearAll();

    // 解绑节点事件
    if (this.node) {
      this.unbindNodeDestroy();
    }

    this._isDestroyed = true;
  }

  /**
   * 获取当前监听器数量
   */
  getListenerCount(): number {
    return this.listeners.length;
  }

  /**
   * 获取特定事件的监听器数量
   */
  getEventListenerCount(event: string): number {
    return this.listeners.filter((l) => l.event === event).length;
  }

  /**
   * 检查是否已销毁
   */
  isDestroyed(): boolean {
    return this._isDestroyed;
  }

  // ==================== 私有方法 ====================

  /**
   * 绑定节点销毁事件
   */
  private bindNodeDestroy(): void {
    if (!this.node) {
      return;
    }

    this.node.on(Node.EventType.NODE_DESTROYED, this.onNodeDestroyed, this);
    this.log("[EventBridge] 已绑定节点销毁事件");
  }

  /**
   * 解绑节点销毁事件
   */
  private unbindNodeDestroy(): void {
    if (!this.node) {
      return;
    }

    this.node.off(Node.EventType.NODE_DESTROYED, this.onNodeDestroyed, this);
  }

  /**
   * 节点销毁回调
   */
  private onNodeDestroyed(): void {
    this.log("[EventBridge] 检测到节点销毁，自动清理事件");
    this.destroy();
  }

  /**
   * 记录事件日志（透过 Logger 控制）
   */
  private logEvent(action: string, event: string, data?: unknown): void {
    // 日志由 Logger 的 level 控制
    // 如果需要记录事件，使用 Logger.debug()
    if (data !== undefined) {
      this.log(`[EventBridge] ${action}: ${event}`, data);
    } else {
      this.log(`[EventBridge] ${action}: ${event}`);
    }
  }

  /**
   * 记录日志
   */
  private log(...args: any[]): void {
    if (GameConfig.isDev) {
      (ServiceBridge.getLogger().info as any)(...args);
    }
  }
}
