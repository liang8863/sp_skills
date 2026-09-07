/**
 * Services 类型定义
 *
 * 包含所有服务的类型
 */

// ==================== SettingsManager ====================
export type { ISettingsManager } from "../../../../../vendor/external-modules/1.0/services/ISettingsManager";

// ==================== Analytics ====================
export type { IAnalytics } from "../../../../../vendor/external-modules/1.0/services/IAnalytics";

// ==================== PlayerDataManager ====================
export type { IPlayerDataManager, IPlayerData, IBalanceChangeData, IBetAmountChangeData } from "../../../../../vendor/external-modules/1.0/services/IPlayerDataManager";

// ==================== AudioManager ====================
export type { IAudioManager, IGameAudioConfig, IAudioSpriteConfig, AudioEvent, ISoundHandle } from "../../../../../vendor/external-modules/1.0/services/IAudioManager";

// ==================== MaxMultiCapService ====================
export type { IMaxMultiCapService, IMaxMultiCapHandleOptions } from "../../../../../vendor/external-modules/1.0/services/MaxMultiCap/IMaxMultiCapService";

// ==================== BundleManager ====================
export type { IBundleManager, IBundleConfig, IBundle, IContentConfig } from "../../../../../vendor/external-modules/1.0/services/IBundleManager";
