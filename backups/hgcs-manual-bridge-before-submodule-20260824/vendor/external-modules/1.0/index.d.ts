/**
 * External Modules 1.0 主入口
 *
 * 提供給所有 50+ 款遊戲共用的模組
 * 包括：Core、UI/UX、Game Logic、Services
 */
import "reflect-metadata";
export * from "./core";
export * from "./uiCocos";
export * from "./services";
export * from "./utils";
export * from "./events";
export * from "./gameLogic";
export * from "./i18n";
export { SERVICE_IDENTIFIERS } from "./types/ServiceIdentifiers";
export { GAME_ACTION_TYPES, type GameActionType } from "./types/GameActionTypes";
export declare const EXTERNAL_MODULES_VERSION = "1.0.0";
import * as Core from "./core";
import * as UICocos from "./uiCocos";
import * as Services from "./services";
import * as Utils from "./utils";
import * as GameLogic from "./gameLogic";
import * as I18n from "./i18n";
declare const ExternalModules: {
    container: import("inversify").Container;
    getService: typeof Core.getService;
    SERVICE_IDENTIFIERS: {
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
    GAME_ACTION_TYPES: {
        readonly SPIN: "spin";
        readonly STOP_AUTO_SPIN: "stopAutoSpin";
        readonly IMMEDIATE_STOP: "immediateStop";
        readonly ADD_BET: "addBet";
        readonly SUBTRACT_BET: "subtractBet";
        readonly MAX_BET: "maxBet";
        readonly SET_BET: "setBet";
        readonly OPEN_BALANCE: "openBalance";
        readonly CLOSE_BALANCE: "closeBalance";
        readonly OPEN_BET_SETTINGS: "openBetSettings";
        readonly CLOSE_BET_SETTINGS: "closeBetSettings";
        readonly OPEN_HISTORY: "openHistory";
        readonly CLOSE_HISTORY: "closeHistory";
        readonly OPEN_MENU: "openMenu";
        readonly CLOSE_MENU: "closeMenu";
        readonly OPEN_PAYTABLE: "openPaytable";
        readonly CLOSE_PAYTABLE: "closePaytable";
        readonly OPEN_RULES: "openRules";
        readonly CLOSE_RULES: "closeRules";
        readonly OPEN_AUTO_SPIN_SETTINGS: "openAutoSpinSettings";
        readonly CLOSE_AUTO_SPIN_SETTINGS: "closeAutoSpinSettings";
        readonly SET_AUTO_SPIN_COUNT: "setAutoSpinCount";
        readonly AUTO_SPIN: "autoSpin";
        readonly ENABLE_TURBO_SPIN: "enableTurboSpin";
        readonly DISABLE_TURBO_SPIN: "disableTurboSpin";
        readonly ENABLE_SOUND: "enableSound";
        readonly DISABLE_SOUND: "disableSound";
        readonly OPEN_FEATURE_BUY: "openFeatureBuy";
        readonly CLOSE_FEATURE_BUY: "closeFeatureBuy";
        readonly CONFIRM_FEATURE_BUY: "confirmFeatureBuy";
        readonly EXIT_GAME: "exitGame";
    };
    VERSION: string;
    I18nRegister: typeof I18n.I18nRegister;
    deepMerge: typeof I18n.deepMerge;
    t: typeof I18n.t;
    setLanguage: typeof I18n.setLanguage;
    getLanguage: typeof I18n.getLanguage;
    COMMON_I18N_KEYS: {
        readonly common: {
            readonly confirm: "common.confirm";
            readonly cancel: "common.cancel";
            readonly quitGame: "common.quitGame";
        };
        readonly loading: {
            readonly getStarted: "loading.getStarted";
            readonly loadingResources: "loading.loadingResources";
        };
        readonly controlPanel: {
            readonly turboEnabled: "controlPanel.turboEnabled";
            readonly turboDisabled: "controlPanel.turboDisabled";
        };
        readonly autoSpin: {
            readonly title: "autoSpin.title";
            readonly autoSpinCount: "autoSpin.autoSpinCount";
            readonly startAutoSpin: "autoSpin.startAutoSpin";
        };
        readonly betPanel: {
            readonly title: "betPanel.title";
            readonly betSize: "betPanel.betSize";
            readonly betLevel: "betPanel.betLevel";
            readonly baseBet: "betPanel.baseBet";
            readonly betAmount: "betPanel.betAmount";
            readonly betLine: "betPanel.betLine";
            readonly maxBet: "betPanel.maxBet";
        };
        readonly menu: {
            readonly quit: "menu.quit";
            readonly sound: "menu.sound";
            readonly paytable: "menu.paytable";
            readonly rules: "menu.rules";
            readonly history: "menu.history";
            readonly close: "menu.close";
        };
        readonly dialog: {
            readonly quitTitle: "dialog.quitTitle";
            readonly quitMessage: "dialog.quitMessage";
            readonly maxBetMessage: "dialog.maxBetMessage";
            readonly minBetMessage: "dialog.minBetMessage";
        };
        readonly maxMultiCap: {
            readonly title: "maxMultiCap.title";
            readonly message: "maxMultiCap.message";
        };
        readonly forceExit: {
            readonly button: "forceExit.button";
            readonly message: "forceExit.message";
        };
        readonly insufficientBalance: {
            readonly title: "insufficientBalance.title";
            readonly message: "insufficientBalance.message";
        };
    };
    en: {
        common: {
            confirm: string;
            cancel: string;
            quitGame: string;
        };
        loading: {
            getStarted: string;
            loadingResources: string;
        };
        controlPanel: {
            turboEnabled: string;
            turboDisabled: string;
        };
        autoSpin: {
            title: string;
            autoSpinCount: string;
            startAutoSpin: string;
        };
        betPanel: {
            title: string;
            betSize: string;
            betLevel: string;
            baseBet: string;
            betLine: string;
            betAmount: string;
            maxBet: string;
        };
        menu: {
            quit: string;
            sound: string;
            paytable: string;
            rules: string;
            history: string;
            close: string;
        };
        dialog: {
            quitTitle: string;
            quitMessage: string;
            maxBetMessage: string;
            minBetMessage: string;
        };
        maxMultiCap: {
            title: string;
            message: string;
        };
        forceExit: {
            button: string;
            message: string;
        };
        insufficientBalance: {
            title: string;
            message: string;
        };
    };
    zh: {
        common: {
            confirm: string;
            cancel: string;
            quitGame: string;
        };
        loading: {
            getStarted: string;
            loadingResources: string;
        };
        controlPanel: {
            turboEnabled: string;
            turboDisabled: string;
        };
        autoSpin: {
            title: string;
            autoSpinCount: string;
            startAutoSpin: string;
        };
        betPanel: {
            title: string;
            betSize: string;
            betLevel: string;
            baseBet: string;
            betLine: string;
            betAmount: string;
            maxBet: string;
        };
        menu: {
            quit: string;
            sound: string;
            paytable: string;
            rules: string;
            history: string;
            close: string;
        };
        dialog: {
            quitTitle: string;
            quitMessage: string;
            maxBetMessage: string;
            minBetMessage: string;
        };
        maxMultiCap: {
            title: string;
            message: string;
        };
        forceExit: {
            button: string;
            message: string;
        };
        insufficientBalance: {
            title: string;
            message: string;
        };
    };
    BASE_GAME_EVENTS: {
        readonly SPIN_START: "game:spin:start";
        readonly SPIN_RESULT: "game:spin:result";
        readonly SPIN_COMPLETE: "game:spin:complete";
        readonly LAST_SPIN_RESTORE: "game:last-spin:restore";
        readonly FREE_GAME_START: "game:free-game:start";
        readonly ANIMATION_COMPLETE: "game:animation:complete";
        readonly STOP_REEL_SPIN: "game:stop-reel-spin";
    };
    BaseGameServiceLogic: typeof GameLogic.BaseGameServiceLogic;
    PLAYER_DATA_EVENTS: {
        readonly BALANCE_CHANGED: "playerData:balanceChanged";
        readonly BET_AMOUNT_CHANGED: "playerData:betAmountChanged";
        readonly BET_BOUNDS_CHANGED: "playerData:betBoundsChanged";
        readonly TOKEN_UPDATED: "playerData:tokenUpdated";
        readonly DATA_LOADED: "playerData:dataLoaded";
        readonly DATA_CLEARED: "playerData:dataCleared";
        readonly UPDATE_WIN: "playerData:updateWin";
    };
    GAME_FLOW_EVENTS: {
        readonly START: "gameFlow:start";
        readonly SPIN: "gameFlow:spin";
        readonly SPIN_END: "gameFlow:spinEnd";
        readonly RESULT: "gameFlow:result";
        readonly END: "gameFlow:end";
        readonly SPIN_RESULT: "game:spin:result";
        readonly STOP_REEL_SPIN: "game:stop-reel-spin";
    };
    GAME_STATE_EVENTS: {
        readonly CHANGED: "gameState:changed";
        readonly TRANSITION_FAILED: "gameState:transitionFailed";
        readonly RESET: "gameState:reset";
        readonly HISTORY_CLEARED: "gameState:historyCleared";
    };
    TURBO_EVENTS: {
        readonly CHANGED: "turbo:changed";
    };
    AUTO_SPIN_EVENTS: {
        readonly START: "game:auto-spin:start";
        readonly PROGRESS: "game:auto-spin:progress";
        readonly STOP: "game:auto-spin:stop";
        readonly COMPLETE: "game:auto-spin:complete";
    };
    LOADING_EVENTS: {
        readonly CLOSED: "loading:closed";
    };
    formatNumber: typeof Utils.formatNumber;
    formatWithCommas: typeof Utils.formatWithCommas;
    clamp: typeof Utils.clamp;
    stringToBoolean: typeof Utils.stringToBoolean;
    formatString: typeof Utils.formatString;
    debounce: typeof Utils.debounce;
    throttle: typeof Utils.throttle;
    splitArrayIntoSegments: typeof Utils.splitArrayIntoSegments;
    CURRENCY_SYMBOLS: Record<string, string>;
    getCurrencySymbol: typeof Utils.getCurrencySymbol;
    formatBetAmount: typeof Utils.formatBetAmount;
    AudioEvent: typeof Services.AudioEvent;
    AudioManager: typeof Services.AudioManager;
    AnalyticsEventType: typeof Services.AnalyticsEventType;
    Analytics: typeof Services.Analytics;
    SettingsEvent: typeof Services.SettingsEvent;
    SettingsManager: typeof Services.SettingsManager;
    PlayerDataManager: typeof Services.PlayerDataManager;
    MaxMultiCapService: typeof Services.MaxMultiCapService;
    BundleManager: typeof Services.BundleManager;
    Bundle: typeof Services.Bundle;
    ForceExitService: typeof Services.ForceExitService;
    BaseComponentView: typeof UICocos.BaseComponentView;
    AbstractToastManager: typeof UICocos.AbstractToastManager;
    PrefabBasedToastManager: typeof UICocos.PrefabBasedToastManager;
    ToastViewLogic: typeof UICocos.ToastViewLogic;
    AbstractDialogManager: typeof UICocos.AbstractDialogManager;
    PrefabBasedDialogManager: typeof UICocos.PrefabBasedDialogManager;
    DialogViewLogic: typeof UICocos.DialogViewLogic;
    AbstractLoadingViewLogic: typeof UICocos.AbstractLoadingViewLogic;
    LoadingViewLogic: typeof UICocos.LoadingViewLogic;
    LoadingManager: typeof UICocos.LoadingManager;
    GamePanelLogic: typeof UICocos.GamePanelLogic;
    AbstractMarqueeBarLogic: typeof UICocos.AbstractMarqueeBarLogic;
    AbstractInfoBarLogic: typeof UICocos.AbstractInfoBarLogic;
    AbstractControlPanelLogic: typeof UICocos.AbstractControlPanelLogic;
    AbstractMenuPanelLogic: typeof UICocos.AbstractMenuPanelLogic;
    AbstractBetPanelLogic: typeof UICocos.AbstractBetPanelLogic;
    BetPanelLogic: typeof UICocos.BetPanelLogic;
    AbstractAutoSpinPanelLogic: typeof UICocos.AbstractAutoSpinPanelLogic;
    AbstractFeatureBuyContentViewLogic: typeof UICocos.AbstractFeatureBuyContentViewLogic;
    FeatureBuyLogic: typeof UICocos.FeatureBuyLogic;
    AbstractReelsContainerLogic: typeof UICocos.AbstractReelsContainerLogic;
    AbstractSlotReelLogic: typeof UICocos.AbstractSlotReelLogic;
    AbstractSlotReelMgrLogic: typeof UICocos.AbstractSlotReelMgrLogic;
    TallSymbolSlotReelLogic: typeof UICocos.TallSymbolSlotReelLogic;
    TallSymbolSlotReelMgrLogic: typeof UICocos.TallSymbolSlotReelMgrLogic;
    LongSymbolCodec: {
        decode(value: number): UICocos.ILongSymbolDecoded;
        isCovered(value: number): boolean;
        buildGroupsFromLayout(layout: readonly number[]): UICocos.ILongSymbolGroup[];
        buildGroupMap(layout: readonly number[]): Map<number, UICocos.ILongSymbolGroup>;
    };
    findLongFrameSprite: typeof UICocos.findLongFrameSprite;
    LongSymbolSlotReelLogic: typeof UICocos.LongSymbolSlotReelLogic;
    LongSymbolSlotReelMgrLogic: typeof UICocos.LongSymbolSlotReelMgrLogic;
    DiscretePickerLogic: typeof UICocos.DiscretePickerLogic;
    AudioButtonLogic: typeof UICocos.AudioButtonLogic;
    SequenceSpriteLogic: typeof UICocos.SequenceSpriteLogic;
    RunCoinLabelLogic: typeof UICocos.RunCoinLabelLogic;
    LogLevel: typeof Core.LogLevel;
    BaseNetworkError: typeof Core.BaseNetworkError;
    HttpError: typeof Core.HttpError;
    NetworkError: typeof Core.NetworkError;
    BusinessError: typeof Core.BusinessError;
    ObjectPool: typeof Core.ObjectPool;
    ObjectPoolManager: typeof Core.ObjectPoolManager;
    GameActionHelper: typeof Core.GameActionHelper;
    GAME_STATES: {
        readonly OPENING: "opening";
        readonly STANDBY: "standby";
        readonly OPEN_BALANCE: "openBalance";
        readonly OPEN_BET_PANEL: "openBetPanel";
        readonly OPEN_HISTORY: "openHistory";
        readonly OPEN_AUTO_SPIN: "openAutoSpin";
        readonly OPEN_MENU: "openMenu";
        readonly OPEN_PAYTABLE: "openPaytable";
        readonly OPEN_RULES: "openRules";
        readonly START_SPIN: "startSpin";
        readonly SPINNING: "spinning";
        readonly END_SPIN: "endSpin";
        readonly AUTO_SPINNING: "autoSpinning";
        readonly OPEN_FEATURE_BUY: "openFeatureBuy";
        readonly WAIT_START_FREE_GAMING: "waitStartFreeGaming";
        readonly FREE_GAMING: "freeGaming";
    };
    STATE_TRANSITION_CONFIG: Record<string, Core.StateConfig>;
    ACTION_TO_STATE_MAP: Partial<Record<string, string>>;
};
declare global {
    interface Window {
        ExternalModules: typeof ExternalModules;
    }
}
//# sourceMappingURL=index.d.ts.map