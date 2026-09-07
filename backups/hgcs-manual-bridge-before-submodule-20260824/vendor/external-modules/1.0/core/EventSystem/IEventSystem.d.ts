/**
 * EventSystem 接口定义
 *
 * 提供事件发布-订阅机制，用于解耦组件之间的通信
 *
 * 特性：
 * - 支持多个监听器
 * - 支持一次性监听器 (once)
 * - 支持绑定上下文 (thisArg)
 * - 支持通配符监听 (例如: 'game:*')
 * - 支持监听器优先级
 * - 支持事件移除
 * - 集成 Logger 记录错误
 *
 * 命名规范：
 * - 事件名使用小写，冒号分隔 (例如：'game:start', 'player:win')
 * - 详见 CLAUDE.md - 命名规则章节
 *
 * 架构定位：
 * - 位于 Core Infrastructure 层
 * - 被 GameLifecyclePipeline 和游戏层依赖
 * - 通过 DI 容器管理（Singleton）
 */
/**
 * 事件监听器函数类型
 */
export type EventListener = (...args: any[]) => void;
/**
 * 事件监听器选项
 */
export interface EventListenerOptions {
    /**
     * 是否只触发一次
     * @default false
     */
    once?: boolean;
    /**
     * 监听器优先级（数字越大越先执行）
     * @default 0
     */
    priority?: number;
}
/**
 * EventSystem 接口
 *
 * @example
 * ```typescript
 * // 基本使用
 * eventSystem.on('game:start', () => console.log('游戏开始'));
 * eventSystem.emit('game:start');
 *
 * // 使用 thisArg 绑定上下文
 * export class GameController extends Component {
 *   onLoad() {
 *     eventSystem.on('game:win', this.handleWin, this);
 *   }
 *
 *   handleWin(amount: number) {
 *     this.score += amount;  // this 指向 GameController
 *   }
 *
 *   onDestroy() {
 *     eventSystem.off('game:win', this.handleWin, this);
 *   }
 * }
 *
 * // 通配符监听
 * eventSystem.on('game:*', (eventName, ...args) => {
 *   console.log(`游戏事件: ${eventName}`, args);
 * });
 * ```
 */
export interface IEventSystem {
    /**
     * 注册事件监听器
     *
     * @param event 事件名称 (例如: 'game:start', 'player:win', 'game:*')
     * @param listener 监听器函数
     * @param thisArg 可选的 this 上下文
     *
     * @example
     * ```typescript
     * // 普通监听
     * eventSystem.on('game:start', () => console.log('游戏开始'));
     *
     * // 带上下文绑定
     * eventSystem.on('game:start', this.handleStart, this);
     *
     * // 通配符监听
     * eventSystem.on('game:*', (eventName, ...args) => {
     *   console.log('游戏事件:', eventName, args);
     * });
     * ```
     */
    on(event: string, listener: EventListener, thisArg?: any): void;
    /**
     * 注册一次性事件监听器
     *
     * 监听器只会被触发一次，然后自动移除
     *
     * @param event 事件名称
     * @param listener 监听器函数
     * @param thisArg 可选的 this 上下文
     *
     * @example
     * ```typescript
     * eventSystem.once('game:ready', () => {
     *   console.log('游戏已准备好（只触发一次）');
     * });
     * ```
     */
    once(event: string, listener: EventListener, thisArg?: any): void;
    /**
     * 移除事件监听器
     *
     * @param event 事件名称
     * @param listener 要移除的监听器函数（不提供则移除该事件的所有监听器）
     * @param thisArg 可选的 this 上下文（必须与注册时相同）
     *
     * @example
     * ```typescript
     * // 移除特定监听器
     * eventSystem.off('game:start', this.handleStart, this);
     *
     * // 移除事件的所有监听器
     * eventSystem.off('game:start');
     * ```
     */
    off(event: string, listener?: EventListener, thisArg?: any): void;
    /**
     * 触发事件
     *
     * @param event 事件名称
     * @param args 传递给监听器的参数
     *
     * @example
     * ```typescript
     * eventSystem.emit('game:start');
     * eventSystem.emit('player:win', 100);
     * eventSystem.emit('game:result', { win: true, amount: 50 });
     * ```
     */
    emit(event: string, ...args: any[]): void;
    /**
     * 移除所有事件监听器
     *
     * @param event 可选的事件名称，如果不提供则移除所有事件
     *
     * @example
     * ```typescript
     * // 移除特定事件的所有监听器
     * eventSystem.removeAllListeners('game:start');
     *
     * // 移除所有事件的所有监听器
     * eventSystem.removeAllListeners();
     * ```
     */
    removeAllListeners(event?: string): void;
    /**
     * 获取事件的监听器数量
     *
     * @param event 事件名称
     * @returns 监听器数量
     *
     * @example
     * ```typescript
     * const count = eventSystem.listenerCount('game:start');
     * console.log(`game:start 有 ${count} 个监听器`);
     * ```
     */
    listenerCount(event: string): number;
    /**
     * 获取所有注册的事件名称
     *
     * @returns 事件名称数组
     *
     * @example
     * ```typescript
     * const events = eventSystem.eventNames();
     * console.log('已注册的事件:', events);
     * // 输出: ['game:start', 'game:spin', 'player:win']
     * ```
     */
    eventNames(): string[];
    /**
     * 检查事件是否有监听器
     *
     * @param event 事件名称
     * @returns 是否有监听器
     *
     * @example
     * ```typescript
     * if (eventSystem.hasListeners('game:start')) {
     *   console.log('game:start 有监听器');
     * }
     * ```
     */
    hasListeners(event: string): boolean;
}
//# sourceMappingURL=IEventSystem.d.ts.map