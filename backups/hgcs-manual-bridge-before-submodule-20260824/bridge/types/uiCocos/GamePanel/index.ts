/**
 * GamePanel 类型定义（从 ExternalModules 同步）
 *
 * 直接从 dist 重新导出，确保类型与运行时一致
 */

// ==================== 从 dist 统一导出 ====================
export type {
    // GamePanel Container
    IGamePanelView,
    GamePanelLogic,

    // GamePanel Components - MarqueeBar
    IMarqueeBarView,
    AbstractMarqueeBarLogic,

    // GamePanel Components - InfoBar
    IInfoBarView,
    AbstractInfoBarLogic,

    // GamePanel Components - ControlPanel
    IControlPanelView,
    AbstractControlPanelLogic,

    // GamePanel Components - MenuPanel
    IMenuPanelView,
    AbstractMenuPanelLogic,

    // GamePanel Components - BetPanel
    IBetPanelView,
    AbstractBetPanelLogic,
    BetPanelLogic,
    BetPanelConfig,
    BetInfo,

    // GamePanel Components - AutoSpinPanel
    IAutoSpinPanelView,
    IToggleLabelColors,
    IStartButtonColors,
    AbstractAutoSpinPanelLogic,

    // GamePanel Components - FeatureBuyPanel
    IFeatureBuyPanelView,
    AbstractFeatureBuyContentViewLogic,

    // GamePanel Components - ReelsContainer
    IReelsContainerView,
    AbstractReelsContainerLogic,

    // GamePanel Components - SlotReel
    ISlotReelSymbolView,
    ISlotReelView,
    ISlotReelMgrView,
    ILanguageSpriteConfig,
    ILanguageSpriteItem,
    AbstractSlotReelLogic,
    IconMappingResult,
    AbstractSlotReelMgrLogic,
    ITallSymbolInfo,

    // SlotReel Hooks
    ISlotReelHooks,
    ISlotReelContext,
    ISlotReelMgrHooks,
    ISlotReelMgrContext,

    // LongSymbol（掩碼版）
    ILongSymbolDecoded,
    ILongSymbolGroup,
    ILongSymbolHooks,
    ILongSymbolContext,
    ILongFrameConfig,
} from "../../../../../../vendor/external-modules/1.0/uiCocos/GamePanel";
