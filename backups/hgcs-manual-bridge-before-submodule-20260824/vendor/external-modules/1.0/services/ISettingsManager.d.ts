/**
 * SettingsManager 接口定義
 *
 * 設定管理系統（總控台概念）
 * 負責程式控制層面的設定管理，供 UI 呼叫
 * 不包含設定面板 UI，僅提供數據管理和控制邏輯
 */
export declare enum SettingsEvent {
    VOLUME_CHANGED = "settings:volumeChanged",
    LANGUAGE_CHANGED = "settings:languageChanged",
    SETTINGS_LOADED = "settings:loaded",
    SETTINGS_SAVED = "settings:saved"
}
export interface VolumeSettings {
    /**
     * 背景音樂音量（0-1）
     */
    bgm: number;
    /**
     * 音效音量（0-1）
     */
    sfx: number;
    /**
     * 主音量（0-1）
     */
    master: number;
}
export interface GameSettings {
    /**
     * 音量設定
     */
    volume: VolumeSettings;
    /**
     * 語言代碼（例如：'en', 'zh-TW', 'ja'）
     */
    language: string;
}
export interface ISettingsManager {
    /**
     * 初始化設定（從本地儲存載入）
     */
    initialize(): void;
    /**
     * 獲取當前設定
     */
    getSettings(): GameSettings;
    /**
     * 設置 BGM 音量
     */
    setBgmVolume(volume: number): void;
    /**
     * 設置 SFX 音量
     */
    setSfxVolume(volume: number): void;
    /**
     * 設置主音量
     */
    setMasterVolume(volume: number): void;
    /**
     * 獲取 BGM 音量
     */
    getBgmVolume(): number;
    /**
     * 獲取 SFX 音量
     */
    getSfxVolume(): number;
    /**
     * 獲取主音量
     */
    getMasterVolume(): number;
    /**
     * 設置語言
     */
    setLanguage(language: string): void;
    /**
     * 獲取當前語言
     */
    getLanguage(): string;
    /**
     * 保存設定到本地儲存
     */
    save(): void;
    /**
     * 重置為預設設定
     */
    reset(): void;
    /**
     * 監聽設定事件
     */
    on(event: SettingsEvent, callback: (data: any) => void): void;
    /**
     * 移除事件監聽
     */
    off(event: SettingsEvent, callback: (data: any) => void): void;
}
//# sourceMappingURL=ISettingsManager.d.ts.map