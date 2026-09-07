import type { ISequenceSpriteView } from "./ISequenceSpriteView";
/**
 * SequenceSprite 邏輯層
 *
 * 職責：序列圖動畫的幀推進與播放控制（純邏輯，不依賴 Cocos decorator）
 *
 * 使用方式（延遲初始化 — ExternalModules 是非同步載入的）：
 * ```typescript
 * import type { SequenceSpriteLogic } from "../../bridge/types/uiCocos/Common";
 *
 * export class CustomSequenceSpriteView extends BaseComponentView implements ISequenceSpriteView {
 *   private logic: SequenceSpriteLogic | null = null;
 *
 *   private _ensureLogic(): boolean {
 *     if (this.logic) return true;
 *     const ext = (window as any).ExternalModules;
 *     if (!ext?.SequenceSpriteLogic) return false;
 *     this.logic = new ext.SequenceSpriteLogic(this);
 *     this.logic.initialize();
 *     return true;
 *   }
 *
 *   onEnable() {
 *     if (this._ensureLogic()) {
 *       this.logic!.play();
 *     }
 *   }
 *
 *   update(dt: number) {
 *     if (!this.logic) {
 *       if (this._ensureLogic()) this.logic!.play();
 *       return;
 *     }
 *     this.logic.tick(dt);
 *   }
 *   onDestroy() { this.logic = null; super.onDestroy(); }
 * }
 * ```
 *
 * 事件：
 * - `sequence-complete`：非循環播放結束時觸發
 * - `sequence-loop`：每次循環結束時觸發
 */
export declare class SequenceSpriteLogic {
    private view;
    private _frames;
    private _frameIndex;
    private _elapsed;
    private _playing;
    /** 非循環播放結束時自動停用節點（loop 模式下無效） */
    autoDisableOnComplete: boolean;
    constructor(view: ISequenceSpriteView);
    get isPlaying(): boolean;
    get totalFrames(): number;
    get currentFrame(): number;
    set currentFrame(v: number);
    /** 建立幀序列（對應原本的 onLoad + _buildFrames） */
    initialize(): void;
    /** 幀推進（由 View 的 update 呼叫） */
    tick(dt: number): void;
    play(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    /** 重新從 atlas 建立幀序列（atlas 或 prefix 改變時呼叫） */
    rebuild(): void;
    private _ensureReady;
    private _buildFrames;
    private _applyFrame;
    private _trailingNum;
}
//# sourceMappingURL=SequenceSpriteLogic.d.ts.map