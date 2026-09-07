/**
 * Core Infrastructure 类型定义
 *
 * 包含所有核心基础设施的类型
 */

// ==================== Logger ====================
export type {
  ILogger,
  LogLevel,
} from "../../../../../vendor/external-modules/1.0/core/Logger/ILogger";

// ==================== EventSystem ====================
// 从 ExternalModules 导出类型定义
export type {
  IEventSystem,
  EventListener,
  EventListenerOptions,
} from "../../../../../vendor/external-modules/1.0/core/EventSystem/IEventSystem";

// ==================== NetworkService ====================
// 从 ExternalModules 导出类型定义
export type {
  INetworkService,
  IRequestConfig,
  IResponse,
  IRequestInterceptor,
  IResponseInterceptor,
  IRetryConfig,
} from "../../../../../vendor/external-modules/1.0/core/Network/INetworkService";

// ==================== ObjectPool ====================
// 从 ExternalModules 导出类型定义
export type {
  IPoolable,
  AnyPoolable,
  IObjectPool,
} from "../../../../../vendor/external-modules/1.0/core/ObjectPool/IObjectPool";

// ==================== GameState ====================
// 只导出类型定义（值从 window.ExternalModules 获取）
export type {
  GameState,
  StateConfig,
  StateTransitionResult,
  StateChangedEvent,
  StateTransitionFailedEvent,
} from "../../../../../vendor/external-modules/1.0/core/GameState/GameStateTypes";

// ==================== Container ====================
// DI Container
export type { getService } from "../../../../../vendor/external-modules/1.0/core/Container";

// ==================== GameStateManager ====================
// 从 ExternalModules 导出类型定义
export type { IGameStateManager } from "../../../../../vendor/external-modules/1.0/core/GameState/IGameStateManager";

// ==================== GameActionService ====================
// 从 ExternalModules 导出类型定义
export type { IGameActionService } from "../../../../../vendor/external-modules/1.0/core/GameAction/IGameActionService";

// ==================== GameStateTypes ====================
// 从 ExternalModules 导出类型定义
export type { GAME_STATES_TYPE } from "../../../../../vendor/external-modules/1.0/core/GameState/GameStateTypes";

// ==================== GameActionTypes ====================
// 只导出类型定义（值从 window.ExternalModules.GAME_ACTION_TYPES 获取）
export type { GAME_ACTION_TYPES } from "../../../../../vendor/external-modules/1.0/types/GameActionTypes";
