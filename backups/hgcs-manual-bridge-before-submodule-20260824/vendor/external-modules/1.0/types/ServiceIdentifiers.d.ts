/**
 * Service 依賴注入標識符
 *
 * 使用 Symbol.for() 確保跨模組的唯一性
 * 命名規則：UPPER_SNAKE_CASE
 */
export declare const SERVICE_IDENTIFIERS: {
    readonly LOGGER: symbol;
    readonly EVENT_SYSTEM: symbol;
    readonly NETWORK_SERVICE: symbol;
    readonly OBJECT_POOL: symbol;
    readonly OBJECT_POOL_MANAGER: symbol;
    readonly INTERACTION_LOCK_MANAGER: symbol;
    readonly GAME_ACTION_SERVICE: symbol;
    readonly GAME_STATE_MANAGER: symbol;
    readonly HOST_BRIDGE: symbol;
    readonly TOAST_MANAGER: symbol;
    readonly DIALOG_MANAGER: symbol;
    readonly LOADING_MANAGER: symbol;
    readonly SETTINGS_MANAGER: symbol;
    readonly SLOT_GAME_ENGINE: symbol;
    readonly PAYLINE_CALCULATOR: symbol;
    readonly SYMBOL_MATCHER: symbol;
    readonly CASCADE_SYSTEM: symbol;
    readonly MULTIPLIER_SYSTEM: symbol;
    readonly WILD_SYMBOL_TRANSFORMER: symbol;
    readonly FREE_SPIN_MANAGER: symbol;
    readonly AUDIO_MANAGER: symbol;
    readonly ANALYTICS: symbol;
    readonly PLAYER_DATA_MANAGER: symbol;
    readonly BUNDLE_MANAGER: symbol;
    readonly MAX_MULTI_CAP_SERVICE: symbol;
    readonly FORCE_EXIT_SERVICE: symbol;
};
export type ServiceIdentifier = (typeof SERVICE_IDENTIFIERS)[keyof typeof SERVICE_IDENTIFIERS];
//# sourceMappingURL=ServiceIdentifiers.d.ts.map