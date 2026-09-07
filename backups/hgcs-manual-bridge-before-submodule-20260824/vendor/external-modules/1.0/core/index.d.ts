/**
 * Core Infrastructure 導出
 *
 * 包含所有核心基礎設施模組
 */
export { ILogger, LogLevel } from "./Logger/ILogger";
export type { IEventSystem, EventListener, EventListenerOptions } from "./EventSystem/IEventSystem";
export type { INetworkService, IRequestConfig, IResponse, IRequestInterceptor, IResponseInterceptor, IRetryConfig } from "./Network/INetworkService";
export { BaseNetworkError, HttpError, NetworkError, BusinessError } from "./Network/NetworkError";
export { IObjectPool, IPoolable, AnyPoolable } from "./ObjectPool/IObjectPool";
export { ObjectPool } from "./ObjectPool/ObjectPool";
export { IObjectPoolManager, IPoolConfig, IPoolStats } from "./ObjectPool/IObjectPoolManager";
export { ObjectPoolManager } from "./ObjectPool/ObjectPoolManager";
export type { getService } from "./Container";
export type { IGameActionService } from "./GameAction/IGameActionService";
export { GameActionHelper } from "./GameAction/GameActionHelper";
export type { IInteractionLockManager } from "./InteractionLock/IInteractionLockManager";
export type { IGameStateManager } from "./GameState/IGameStateManager";
export type { GameState, StateConfig, StateTransitionResult, StateChangedEvent, StateTransitionFailedEvent } from "./GameState/GameStateTypes";
export { GAME_STATES, type GAME_STATES_TYPE } from "./GameState/GameStateTypes";
export { STATE_TRANSITION_CONFIG, ACTION_TO_STATE_MAP } from "./GameState/GameStateConfig";
export type { IHostBridge, UserInfo, ModalPayload, ModalCallback, TokenCallback } from "./HostBridge/IHostBridge";
//# sourceMappingURL=index.d.ts.map