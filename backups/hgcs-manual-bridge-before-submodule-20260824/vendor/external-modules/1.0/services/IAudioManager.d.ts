/**
 * AudioManager 接口定義
 *
 * 音頻管理系統，負責：
 * 1. BGM 播放和控制
 * 2. SFX 播放（支持 Audio Sprite）
 * 3. 音量統一管理（只有 master）
 * 4. 音頻資源載入和緩存
 *
 * 設計原則：
 * - 統一音量控制（只有 master 音量）
 * - 支持 Audio Sprite（多個音效在同一文件中）
 * - 支持多個 Sprite 文件（按類型分組）
 * - 自動資源管理（預載入、釋放）
 */
export declare enum AudioEvent {
    BGM_STARTED = "audio:bgmStarted",
    BGM_STOPPED = "audio:bgmStopped",
    BGM_PAUSED = "audio:bgmPaused",
    BGM_RESUMED = "audio:bgmResumed",
    SFX_PLAYED = "audio:sfxPlayed",
    SFX_STOPPED = "audio:sfxStopped",
    VOLUME_CHANGED = "audio:volumeChanged",
    MUTE_CHANGED = "audio:muteChanged"
}
/**
 * 音效句柄
 * 用於控制正在播放的音效
 *
 * @example
 * ```typescript
 * // 循環播放音效
 * const handle = await audioManager.playSound('loopSound', true);
 *
 * // 稍後停止
 * handle?.stop();
 *
 * // 檢查是否正在播放
 * if (handle?.isPlaying()) {
 *   console.log('音效播放中');
 * }
 * ```
 */
export interface ISoundHandle {
    /**
     * 音效 key
     */
    readonly key: string;
    /**
     * 停止播放此音效
     */
    stop(): void;
    /**
     * 檢查音效是否正在播放
     * @returns true 表示正在播放
     */
    isPlaying(): boolean;
}
/**
 * Audio Sprite 配置
 * 支持在單一音頻文件中包含多個音效
 *
 * @example
 * ```typescript
 * const sprite: IAudioSpriteConfig = {
 *   src: 'audio/sfx-ui',
 *   sprite: {
 *     buttonClick: [0.0, 0.3],   // 從 0.0 秒開始，持續 0.3 秒
 *     buttonHover: [0.3, 0.2],   // 從 0.3 秒開始，持續 0.2 秒
 *   },
 *   preload: true,  // 是否預載入
 * };
 * ```
 */
export interface IAudioSpriteConfig {
    /**
     * 音頻文件路徑（不含副檔名）
     * Cocos 會自動根據平台選擇格式
     */
    src: string;
    /**
     * Sprite 映射表
     * key: 音效名稱
     * value: [startTime, duration] - 開始時間和持續時間（秒）
     */
    sprite: Record<string, [number, number]>;
    /**
     * 是否預載入
     * true: 初始化時載入
     * false: 首次播放時載入
     * @default false
     */
    preload?: boolean;
}
/**
 * 遊戲音頻配置
 *
 * @example
 * ```typescript
 * const config: IGameAudioConfig = {
 *   bgm: {
 *     lobby: 'audio/bgm/lobby-bgm',
 *     game: 'audio/bgm/game-bgm',
 *   },
 *   sfx: {
 *     sprites: {
 *       ui: {
 *         src: 'audio/sfx-ui',
 *         preload: true,
 *         sprite: {
 *           buttonClick: [0.0, 0.3],
 *           buttonHover: [0.3, 0.2],
 *         },
 *       },
 *       game: {
 *         src: 'audio/sfx-game',
 *         preload: true,
 *         sprite: {
 *           spinStart: [0.0, 1.5],
 *           spinStop: [1.5, 0.8],
 *           win: [2.3, 1.2],
 *         },
 *       },
 *     },
 *   },
 *   volumes: {
 *     master: 1.0,
 *   },
 * };
 * ```
 */
export interface IGameAudioConfig {
    /**
     * BGM 配置（key-value 映射）
     * key: BGM 名稱（如 'lobby', 'game'）
     * value: 音頻文件路徑（不含副檔名）
     */
    bgm: Record<string, string>;
    /**
     * SFX 配置
     */
    sfx: {
        /**
         * Audio Sprite 配置（支持多個 sprite 文件）
         * key: Sprite 名稱（如 'ui', 'game', 'win'）
         * value: Sprite 配置
         */
        sprites: Record<string, IAudioSpriteConfig>;
    };
    /**
     * 統一音量配置（0-1）
     */
    volumes: {
        /**
         * 主音量（影響所有音頻）
         * @default 1.0
         */
        master: number;
    };
    /** SFX 对象池大小（不填默认 7） */
    sfxPoolSize?: number;
}
/**
 * AudioManager 接口
 *
 * 使用方式：
 * ```typescript
 * // 通過 ServiceBridge 訪問
 * import { ServiceBridge } from './bridge';
 *
 * // 初始化（在 Bootstrap 中）
 * const audioConfig = GameConfig.audio;
 * await ServiceBridge.getAudioManager().initialize(audioConfig);
 *
 * // 播放 BGM
 * ServiceBridge.playMusic('game');  // 使用 config 中的 key
 *
 * // 播放音效（從 Sprite）
 * ServiceBridge.playSound('buttonClick');  // 自動從 sprites 中查找
 *
 * // 音量控制
 * ServiceBridge.getAudioManager().setMasterVolume(0.5);
 * ServiceBridge.getAudioManager().muteAll();
 * ```
 */
export interface IAudioManager {
    /**
     * 初始化 AudioManager
     * 載入配置並預載入標記為 preload 的音頻資源
     *
     * @param audioConfig 遊戲音頻配置
     * @throws 如果配置格式錯誤
     *
     * @example
     * ```typescript
     * const config: IGameAudioConfig = {
     *   bgm: { game: 'audio/bgm/game-bgm' },
     *   sfx: {
     *     sprites: {
     *       ui: {
     *         src: 'audio/sfx-ui',
     *         preload: true,
     *         sprite: {
     *           buttonClick: [0.0, 0.3],
     *         },
     *       },
     *     },
     *   },
     *   volumes: { master: 1.0 },
     * };
     *
     * await audioManager.initialize(config);
     * ```
     */
    initialize(audioConfig: IGameAudioConfig): Promise<void>;
    /**
     * 播放 BGM
     *
     * @param musicKey BGM 的 key（在 config.bgm 中定義）
     * @param loop 是否循環播放
     * @throws 如果找不到對應的 BGM 配置
     *
     * @example
     * ```typescript
     * // config.bgm = { game: 'audio/bgm/game-bgm' }
     * await audioManager.playMusic('game', true);
     * ```
     */
    playMusic(musicKey: string, loop?: boolean): Promise<void>;
    /**
     * 停止當前 BGM
     */
    stopMusic(): void;
    /**
     * 快進當前 BGM 到skipTime
     */
    skipMusic(skipTime: number): void;
    /**
     * 淡出當前 BGM 後停止
     *
     * @param duration 淡出時長（秒），預設 1.0
     */
    fadeOutMusic(duration?: number): void;
    /**
     * 設定 BGM 獨立音量倍率（0-1），不影響 SFX
     * 實際 BGM volume = masterVolume * bgmVolumeMultiplier
     */
    setBgmVolume(volume: number): void;
    /**
     * Fade BGM 到目標音量倍率（0-1）
     * @param targetVolume 目標 BGM 倍率
     * @param duration 淡變時長（秒）
     */
    fadeBgmVolume(targetVolume: number, duration: number): void;
    /**
     * 暫停當前 BGM
     */
    pauseMusic(): void;
    /**
     * 恢復播放 BGM
     */
    resumeMusic(): void;
    /**
     * 播放音效（從 Audio Sprite）
     * 自動從配置的所有 sprites 中查找對應的音效
     *
     * @param soundKey 音效的 key（在 sprite.sprite 中定義）
     * @param loop 是否循環播放（預設 false）
     * @returns 音效句柄，用於控制播放；如果播放失敗則返回 null
     *
     * @example
     * ```typescript
     * // 播放一次性音效
     * await audioManager.playSound('buttonClick');
     *
     * // 循環播放音效，並保留句柄以便稍後停止
     * const handle = await audioManager.playSound('ambientLoop', true);
     * // ... 稍後停止
     * handle?.stop();
     *
     * // 播放長音效，在中途停止
     * const longHandle = await audioManager.playSound('longSound');
     * setTimeout(() => longHandle?.stop(), 15000); // 15 秒後停止
     * ```
     */
    playSound(soundKey: string, loop?: boolean): Promise<ISoundHandle | null>;
    /**
     * 停止特定音效
     * 會停止所有該 soundKey 的實例（包括循環播放的）
     *
     * @param soundKey 音效的 key
     *
     * @example
     * ```typescript
     * // 播放循環音效
     * await audioManager.playSound('ambientLoop', true);
     *
     * // 停止該音效
     * audioManager.stopSound('ambientLoop');
     * ```
     */
    stopSound(soundKey: string): void;
    /**
     * 停止所有正在播放的音效
     */
    stopAllSounds(): void;
    /**
     * 設置主音量（影響所有音頻）
     *
     * @param volume 音量值（0-1）
     */
    setMasterVolume(volume: number): void;
    /**
     * 獲取主音量
     * @returns 音量值（0-1）
     */
    getMasterVolume(): number;
    /**
     * 全局靜音
     */
    muteAll(): void;
    /**
     * 取消全局靜音
     */
    unmuteAll(): void;
    /**
     * 檢查是否靜音
     * @returns true 表示已靜音
     */
    isMuted(): boolean;
    /**
     * 預載入指定場景的 Sprite 資源
     * 用於場景切換時提前載入音效
     *
     * @param spriteNames Sprite 名稱列表（在 config.sfx.sprites 中的 key）
     *
     * @example
     * ```typescript
     * // 進入遊戲場景前預載入音效
     * await audioManager.preloadSceneSprites(['game', 'win']);
     * ```
     */
    preloadSceneSprites(spriteNames: string[]): Promise<void>;
    /**
     * 釋放指定 Sprite 資源
     * 用於場景切換時釋放不再使用的音效
     *
     * @param spriteName Sprite 名稱
     *
     * @example
     * ```typescript
     * // 離開大廳場景時釋放資源
     * audioManager.releaseSprite('lobby');
     * ```
     */
    releaseSprite(spriteName: string): void;
    /**
     * 監聽音頻事件
     *
     * @param event 事件名稱
     * @param callback 回調函數
     *
     * @example
     * ```typescript
     * audioManager.on(AudioEvent.VOLUME_CHANGED, (data) => {
     *   console.log('音量變化:', data);
     * });
     * ```
     */
    on(event: AudioEvent | string, callback: (data?: any) => void): void;
    /**
     * 取消監聽音頻事件
     *
     * @param event 事件名稱
     * @param callback 回調函數
     */
    off(event: AudioEvent | string, callback: (data?: any) => void): void;
}
//# sourceMappingURL=IAudioManager.d.ts.map