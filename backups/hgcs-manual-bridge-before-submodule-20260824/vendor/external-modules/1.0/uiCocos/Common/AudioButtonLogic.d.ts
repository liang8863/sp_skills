import type { IAudioButtonView } from "./IAudioButtonView";
/**
 * AudioButton 邏輯層
 *
 * 職責：處理按鈕點擊時播放音效的業務邏輯
 *
 * 使用方式：
 * ```typescript
 * // 在遊戲項目的 CustomAudioButtonView 中
 * export class CustomAudioButtonView extends Component implements IAudioButtonView {
 *   private logic: any = null;
 *
 *   start() {
 *     const { AudioButtonLogic } = (window as any).ExternalModules;
 *     this.logic = new AudioButtonLogic(this);
 *     this.logic.initialize();
 *   }
 *
 *   onDestroy() {
 *     this.logic?.destroy();
 *   }
 * }
 * ```
 */
export declare class AudioButtonLogic {
    private view;
    private static readonly CLICK_COOLDOWN_MS;
    private logger;
    private audioManager;
    private lastPlayTime;
    constructor(view: IAudioButtonView);
    /**
     * 初始化：獲取服務並綁定按鈕點擊事件
     */
    initialize(): void;
    /**
     * 銷毀：解綁按鈕點擊事件
     */
    destroy(): void;
    /**
     * 處理按鈕點擊
     */
    private handleClick;
}
//# sourceMappingURL=AudioButtonLogic.d.ts.map