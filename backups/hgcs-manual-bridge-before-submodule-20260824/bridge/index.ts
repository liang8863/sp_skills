/**
 * ExternalModules Bridge for Cocos Creator
 *
 * 这个模组提供了 Cocos Creator 与 ExternalModules 之间的桥接层
 *
 * 主要功能：
 * 1. Loader - 动态载入 ExternalModules
 * 2. ServiceBridge - 统一的 Service 访问入口
 * 3. EventBridge - 自动管理事件生命周期
 * @packageDocumentation
 */

// ==================== 核心类 ====================
export { Loader } from "./Loader";
export { ServiceBridge } from "./ServiceBridge";
export { EventBridge } from "./EventBridge";
export { BaseComponentView } from "./components/BaseComponentView";
export { HostBridge, getHostBridge } from "./HostBridge";
export type { UserInfo, ModalPayload, TokenCallback, ModalCallback } from "./HostBridge";

// ==================== 类型定义 ====================
export type {
    // Core Infrastructure
    ILogger,
    LogLevel,
    IEventSystem,
    INetworkService,
    IObjectPool,
    IPoolable,
    IRequestConfig,
    IResponse,
    EventListener,
    EventListenerOptions,
} from "./types/core";

export type {
    // UI/UX Layer
    IToastManager,
    IToastOptions,
    IDialogManager,
    ILoadingManager,
} from "./types/uiCocos";

export type {
    // Services
    ISettingsManager,
    IAudioManager,
    IAnalytics,
} from "./types/services";

export type {
    // Bridge Layer
    IServiceLocator,
    ISlotGameExtModule as IExternalModules,
    ILoaderResult,
} from "./types/bridge";
