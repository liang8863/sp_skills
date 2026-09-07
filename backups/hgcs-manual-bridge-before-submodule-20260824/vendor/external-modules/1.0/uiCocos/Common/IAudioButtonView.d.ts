import type { Button, Node } from "cc";
/**
 * AudioButton View 接口
 *
 * 職責：提供音效按鈕 UI 元素訪問器
 */
export interface IAudioButtonView {
    /**
     * 獲取根節點
     */
    getNode(): Node;
    /**
     * 獲取按鈕組件
     */
    getButton(): Button | null;
    /**
     * 獲取音效 key
     */
    getSoundKey(): string;
}
//# sourceMappingURL=IAudioButtonView.d.ts.map