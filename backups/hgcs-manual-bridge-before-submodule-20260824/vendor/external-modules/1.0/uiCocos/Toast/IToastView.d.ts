import { Node, Label, Sprite } from "cc";
/**
 * Toast View 接口（超薄殼 - 只提供訪問器）
 *
 * Toast View 只負責提供 Cocos 組件的訪問，所有業務邏輯由 ToastViewLogic 處理
 *
 * 使用範例：
 * ```typescript
 * @ccclass('CustomToastView')
 * export class CustomToastView extends Component implements IToastView {
 *   @property(Label) messageLabel: Label;
 *   @property(Sprite) backgroundSprite: Sprite;
 *   @property(Sprite) iconSprite: Sprite | null;
 *
 *   getNode() { return this.node; }
 *   getLabel() { return this.messageLabel; }
 *   getBackgroundSprite() { return this.backgroundSprite; }
 *   getIconSprite() { return this.iconSprite; }
 * }
 * ```
 */
export interface IToastView {
    /**
     * 獲取 Toast 根節點
     */
    getNode(): Node;
    /**
     * 獲取消息 Label
     */
    getLabel(): Label;
    /**
     * 獲取背景 Sprite
     */
    getBackgroundSprite(): Sprite;
    /**
     * 獲取圖標 Sprite（可選）
     */
    getIconSprite(): Sprite | null;
}
//# sourceMappingURL=IToastView.d.ts.map