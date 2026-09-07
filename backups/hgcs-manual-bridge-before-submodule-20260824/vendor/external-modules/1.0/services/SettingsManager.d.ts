import { ISettingsManager, GameSettings, SettingsEvent } from "./ISettingsManager";
import { ILogger } from "../core/Logger/ILogger";
/**
 * SettingsManager 實現骨架
 *
 * 功能：
 * - 管理音量設定（BGM、SFX、Master）
 * - 管理語言設定
 * - 本地儲存持久化
 * - 事件通知機制
 *
 * TODO: 後續補充完整實現
 * - LocalStorage 持久化
 * - 與 AudioManager 集成
 * - 與 I18nManager 集成
 */
export declare class SettingsManager implements ISettingsManager {
    private logger;
    private settings;
    private eventListeners;
    private readonly STORAGE_KEY;
    private readonly DEFAULT_SETTINGS;
    constructor(logger: ILogger);
    initialize(): void;
    getSettings(): GameSettings;
    setBgmVolume(volume: number): void;
    setSfxVolume(volume: number): void;
    setMasterVolume(volume: number): void;
    getBgmVolume(): number;
    getSfxVolume(): number;
    getMasterVolume(): number;
    setLanguage(language: string): void;
    getLanguage(): string;
    save(): void;
    reset(): void;
    on(event: SettingsEvent, callback: (data: any) => void): void;
    off(event: SettingsEvent, callback: (data: any) => void): void;
    private emit;
}
//# sourceMappingURL=SettingsManager.d.ts.map