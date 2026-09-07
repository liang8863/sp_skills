import type { Node } from "cc";
import type { ISlotReelSymbolView } from "./ISlotReelSymbolView";
/**
 * SlotReel View 接口
 *
 * 職責：提供單一轉軸的 UI 元素訪問器與 Cocos 能力代理
 */
export interface ISlotReelView {
    /**
     * 獲取轉軸根節點
     */
    getNode(): Node;
    /**
     * 獲取所有圖標 Symbol View 列表
     */
    getSymbolViewList(): ISlotReelSymbolView[];
    /**
     * 是否為橫向滾軸（可選，預設 false）
     */
    getIsHorizontal?(): boolean;
    /**
     * 註冊 update 回調（每幀執行）
     */
    registerUpdate(callback: (dt: number) => void): void;
    /**
     * 取消註冊 update 回調
     */
    unregisterUpdate(callback: (dt: number) => void): void;
    /**
     * 重複執行排程
     */
    scheduleCallback(callback: (dt: number) => void, interval: number, repeat?: number, delay?: number): void;
    /**
     * 延遲執行一次
     */
    scheduleOnceCallback(callback: () => void, delay: number): void;
    /**
     * 取消指定排程回調
     */
    unscheduleCallback(callback: Function): void;
    /**
     * 取消所有排程回調
     */
    unscheduleAllCallbacks(): void;
}
//# sourceMappingURL=ISlotReelView.d.ts.map