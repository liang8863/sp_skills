import type { Label, Node, UITransform } from "cc";
/**
 * MarqueeBar View 接口
 *
 * 職責：提供跑馬燈 UI 元素訪問器和調度功能
 */
export interface IMarqueeBarView {
    /**
     * 獲取根節點
     */
    getNode(): Node;
    /**
     * 獲取跑馬燈文字 Label（模板 Label，用於複製樣式）
     * @deprecated 建議使用 getContentContainer()，此方法保留用於向下兼容
     */
    getMarqueeLabel(): Label | null;
    /**
     * 獲取 Mask 節點（用於裁切滾動區域）
     */
    getMaskNode(): Node | null;
    /**
     * 獲取內容容器節點（滾動的對象）
     * 容器內會動態創建 Label 或 Sprite
     */
    getContentContainer(): Node | null;
    /**
     * 獲取 Label 的 UITransform（用於計算文字寬度）
     * @deprecated 建議使用 getContentContainer()，此方法保留用於向下兼容
     */
    getMarqueeLabelTransform(): UITransform | null;
    /**
     * 獲取 Mask 的 UITransform（用於計算可視區域寬度）
     */
    getMaskTransform(): UITransform | null;
    /**
     * 延遲執行一次（使用 Cocos scheduleOnce）
     * @param callback 回調函數
     * @param delay 延遲時間（秒）
     */
    scheduleOnceCallback(callback: () => void, delay: number): void;
    /**
     * 取消所有調度
     */
    unscheduleAllCallbacks(): void;
}
//# sourceMappingURL=IMarqueeBarView.d.ts.map