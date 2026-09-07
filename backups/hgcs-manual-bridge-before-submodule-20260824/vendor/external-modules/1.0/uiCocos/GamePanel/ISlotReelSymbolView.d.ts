import type { Node, Sprite } from "cc";
/**
 * SlotReelSymbol View 接口
 *
 * 職責：提供單一圖標的 UI 元素訪問器
 */
export interface ISlotReelSymbolView {
    /**
     * 獲取根節點
     */
    getNode(): Node;
    /**
     * 獲取圖標 Sprite
     */
    getIcon(): Sprite | null;
    /**
     * 獲取背景圖標 Sprite
     */
    getBgIcon(): Sprite | null;
    /**
     * 獲取特殊裝飾節點
     */
    getSpIcon(): Node | null;
    /**
     * 獲取長條圖標容器節點（可選，僅支援長條圖標的遊戲需實作）
     */
    getTallSymbolNode?(): Node | null;
}
//# sourceMappingURL=ISlotReelSymbolView.d.ts.map