/**
 * AudioManager 實現
 *
 * 音頻管理系統，支持：
 * - BGM 播放和控制
 * - Audio Sprite SFX 播放
 * - 統一音量管理
 * - 資源載入和緩存
 */
import { AudioSource } from "cc";
import { IAudioManager, IGameAudioConfig, AudioEvent, ISoundHandle } from "./IAudioManager";
import { ILogger } from "../core/Logger/ILogger";
import { IEventSystem } from "../core/EventSystem/IEventSystem";
/**
 * 音效句柄實現
 */
declare class SoundHandle implements ISoundHandle {
    readonly key: string;
    private source;
    private manager;
    constructor(key: string, source: AudioSource, manager: AudioManager);
    stop(): void;
    isPlaying(): boolean;
}
export declare class AudioManager implements IAudioManager {
    private logger;
    private events;
    constructor(logger: ILogger, events: IEventSystem);
    private config;
    private isInitialized;
    private masterVolume;
    private muted;
    private bgmVolumeMultiplier;
    private _bgmFadeTimer;
    private currentBgmKey;
    private bgmAudioSource;
    private bgmNode;
    private _fadeOutTimer;
    private sfxAudioSources;
    private sfxPoolSize;
    private activeSounds;
    private playIdCounter;
    private bgmClips;
    private spriteClips;
    private spriteConfigs;
    initialize(audioConfig: IGameAudioConfig): Promise<void>;
    /**
     * 初始化 BGM AudioSource
     */
    private initializeBgmAudioSource;
    /**
     * 初始化 SFX AudioSource 對象池
     */
    private initializeSfxAudioSources;
    /**
     * 載入 Sprite 配置
     */
    private loadSpriteConfigs;
    /**
     * 預載入標記為 preload 的 Sprite
     */
    private preloadMarkedSprites;
    private preloadBgmClips;
    playMusic(musicKey: string, loop?: boolean): Promise<void>;
    skipMusic(skipTime: number): void;
    stopMusic(): void;
    private _computeBgmVolume;
    fadeOutMusic(duration?: number): void;
    setBgmVolume(volume: number): void;
    fadeBgmVolume(targetVolume: number, duration: number): void;
    pauseMusic(): void;
    resumeMusic(): void;
    playSound(soundKey: string, loop?: boolean): Promise<ISoundHandle | null>;
    stopSound(soundKey: string): void;
    stopAllSounds(): void;
    /**
     * 透過句柄停止音效（內部方法）
     */
    stopSoundByHandle(handle: SoundHandle): void;
    /**
     * 查找音效所屬的 Sprite
     */
    private findSoundInSprites;
    /**
     * 獲取可用的 SFX AudioSource
     */
    private getAvailableSfxSource;
    setMasterVolume(volume: number): void;
    getMasterVolume(): number;
    muteAll(): void;
    unmuteAll(): void;
    isMuted(): boolean;
    preloadSceneSprites(spriteNames: string[]): Promise<void>;
    releaseSprite(spriteName: string): void;
    /**
     * 載入音頻資源
     */
    private loadAudioClip;
    on(event: AudioEvent | string, callback: (data?: any) => void): void;
    off(event: AudioEvent | string, callback: (data?: any) => void): void;
    private checkInitialized;
}
export {};
//# sourceMappingURL=AudioManager.d.ts.map