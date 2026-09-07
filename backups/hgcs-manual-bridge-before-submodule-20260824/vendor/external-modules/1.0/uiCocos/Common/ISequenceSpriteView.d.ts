import type { Sprite, SpriteAtlas } from "cc";
/**
 * SequenceSprite View 接口
 *
 * 職責：提供序列圖動畫所需的 Cocos UI 元素訪問器
 */
export interface ISequenceSpriteView {
    /** 獲取 Sprite 組件 */
    getSprite(): Sprite | null;
    /** 獲取 SpriteAtlas（plist） */
    getAtlas(): SpriteAtlas | null;
    /** 獲取播放幀率 */
    getFps(): number;
    /** 是否循環播放 */
    isLoop(): boolean;
    /** 獲取過濾前綴 */
    getPrefix(): string;
    /** 向節點發送事件 */
    emitEvent(eventName: string): void;
    /** 停用節點（node.active = false） */
    disableNode(): void;
}
//# sourceMappingURL=ISequenceSpriteView.d.ts.map