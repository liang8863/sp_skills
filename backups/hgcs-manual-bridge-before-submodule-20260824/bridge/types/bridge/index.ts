/**
 * Bridge 层特有类型定义
 *
 * 包含 Bridge 层自定义的接口和类型
 */

// 导入需要的类型
import type { ILogger } from "../core";
import type { IEventSystem } from "../core";
import type { INetworkService } from "../core";
import type { IToastManager } from "../uiCocos";
import type { IDialogManager } from "../uiCocos";
import type { ILoadingManager } from "../uiCocos";
import type { ISettingsManager } from "../services";
import type { IAudioManager } from "../services";
import type { IAnalytics } from "../services";

// ==================== Config Types ====================
export type { IGameConfig } from "./IConfig";

// ==================== Service Identifiers ====================
export interface SERVICE_IDENTIFIERS_TYPE {
  readonly LOGGER: symbol;
  readonly EVENT_SYSTEM: symbol;
  readonly NETWORK_SERVICE: symbol;
  readonly OBJECT_POOL: symbol;
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
}

export type ServiceIdentifier = symbol;

// ==================== ServiceLocator ====================
export interface IServiceLocator {
  get<T>(identifier: symbol): T;

  // Core
  getLogger(): ILogger;
  getEventSystem(): IEventSystem;
  getNetworkService(): INetworkService;

  // UI/UX
  getToastManager(): IToastManager;
  getDialogManager(): IDialogManager;
  getLoadingManager(): ILoadingManager;

  // Services
  getSettingsManager(): ISettingsManager;
  getAudioManager(): IAudioManager;
  getAnalytics(): IAnalytics;
}

// ==================== SlotGameExtModule ====================
export interface ISlotGameExtModule extends IServiceLocator {
  container: any;
  SERVICE_IDENTIFIERS: Record<string, symbol>;
  version: string;
}

// ==================== LoaderResult ====================
export interface ILoaderResult {
  success: boolean;
  version: string;
  slotGameExtModule: ISlotGameExtModule | null;
  error: Error | undefined;
}
