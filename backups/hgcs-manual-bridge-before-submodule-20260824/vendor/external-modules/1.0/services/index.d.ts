/**
 * Services 導出
 *
 * 包含所有通用服務（不依賴 Cocos）
 */
export { IAudioManager, IGameAudioConfig, IAudioSpriteConfig, AudioEvent, ISoundHandle } from "./IAudioManager";
export { AudioManager } from "./AudioManager";
export { IAnalytics, AnalyticsEvent, AnalyticsEventType, PerformanceMetrics } from "./IAnalytics";
export { Analytics } from "./Analytics";
export { ISettingsManager, VolumeSettings, GameSettings, SettingsEvent } from "./ISettingsManager";
export { SettingsManager } from "./SettingsManager";
export { IPlayerDataManager, IPlayerData, IBalanceChangeData, IBetAmountChangeData } from "./IPlayerDataManager";
export { PlayerDataManager } from "./PlayerDataManager";
export { IMaxMultiCapService, IMaxMultiCapHandleOptions } from "./MaxMultiCap/IMaxMultiCapService";
export { MaxMultiCapService } from "./MaxMultiCap/MaxMultiCapService";
export * from "./ForceExit/IForceExitService";
export * from "./ForceExit/ForceExitService";
export { IBundleConfig, IBundleManager, IBundle, IContentConfig } from "./IBundleManager";
export { BundleManager, Bundle } from "./BundleManager";
//# sourceMappingURL=index.d.ts.map