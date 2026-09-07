import type { SpriteFrame } from "cc";
import type { ISlotReelView } from "./ISlotReelView";
import type { ISlotReelSymbolView } from "./ISlotReelSymbolView";
import type { IconMappingResult } from "./AbstractSlotReelLogic";
import type { ITallSymbolInfo } from "./ITallSymbolInfo";
/**
 * SlotReel Hook 的上下文物件
 *
 * 提供 hook 函式存取轉軸內部狀態與方法的能力
 */
export interface ISlotReelContext {
    readonly reelIndex: number;
    readonly result: number[];
    readonly totalIcons: number;
    readonly symbolViewList: ISlotReelSymbolView[];
    readonly iconSpriteFrameList: SpriteFrame[];
    readonly bgSpriteFrameList: SpriteFrame[];
    readonly view: ISlotReelView;
    /** 長條圖標映射表（position index → tall info），僅長條圖標遊戲有值 */
    readonly tallSymbolMap?: ReadonlyMap<number, ITallSymbolInfo>;
    /** 遊戲資料轉換（預設實現） */
    getIconAndBgIndex(resultIndex: number): IconMappingResult;
    /** 設定單個 Symbol 的顯示 */
    setSymbolDisplay(symbolView: ISlotReelSymbolView, icon: SpriteFrame, iconIndex: number, bgIcon?: SpriteFrame | null, spIconActive?: boolean): void;
    /** 處理消除表現（內部邏輯） */
    dropSymbolPerformance(clearIndexList: number[], goldDropIndexList: number[] | null, changeSymbolCode: number | null, changeSymbolIconIndex: number | null): void;
    /** 更新圖標（移出畫面外的圖標移回最上並更換圖片） */
    updateIcon(iconIndex: number, bgIndex?: number, openSpIcon?: boolean): void;
}
/**
 * SlotReel Hooks 介面
 *
 * 遊戲端透過傳入 hooks 物件來客製化轉軸行為
 */
export interface ISlotReelHooks {
    /** 覆寫圖標映射邏輯（回傳 icon/bg 索引） */
    getIconAndBgIndex?(resultIndex: number): IconMappingResult;
    /** 覆寫隨機圖標邏輯；回傳值表示要使用的 icon/bg，void 表示走預設 */
    updateRandIcon?(ctx: ISlotReelContext): {
        iconIndex: number;
        bgIndex?: number;
    } | void;
    /** 覆寫 setAllSymbol；回傳 true 表示已自行處理（跳過預設邏輯） */
    onSetAllSymbol?(ctx: ISlotReelContext, resultList: number[], isInitial: boolean): boolean | void;
    /** startSpin 完成後呼叫 */
    onAfterStartSpin?(ctx: ISlotReelContext): void;
    /** setSpinResult 完成後呼叫 */
    onAfterSetSpinResult?(ctx: ISlotReelContext): void;
    /** stopAni 完成前呼叫 */
    onBeforeStopAni?(ctx: ISlotReelContext, isPeeking: boolean): boolean | void;
    onRevertBlurSpriteFrame?(symbolView: ISlotReelSymbolView, icon: SpriteFrame): boolean | void;
    /** finishSpin 完成後呼叫 */
    onAfterFinishSpin?(ctx: ISlotReelContext): void;
    /** 覆寫 adjustSymbolSorting；回傳 true 表示已自行處理（跳過預設邏輯） */
    onAdjustSymbolSorting?(ctx: ISlotReelContext): boolean | void;
    /** 覆寫 startClearSequence；回傳 true 表示已自行處理（跳過預設邏輯） */
    onStartClearSequence?(ctx: ISlotReelContext, dropIndexList: number[], layout: number[], goldDropIndexList: number[] | null): boolean | void;
    /** startDropSequence 開頭呼叫，isPeeking 表示是否處於瞇牌狀態 */
    onBeforeStartDropSequence?(ctx: ISlotReelContext, newResultList: number[], isPeeking: boolean): number | void;
    checkSymbolIsOld?(ctx: ISlotReelContext, symbolForward: number): boolean | void;
    /** startDropSequence 結尾呼叫 */
    onEndBeforeStartDropSequence?(ctx: ISlotReelContext, newResultList: number[], appendSymbolCount: number): void;
    /** overDropCallBack 完成後呼叫 */
    onAfterOverDropCallBack?(ctx: ISlotReelContext, index: number, symbolCode: number, shouldPlayIdleOnly: boolean): void;
    /** 覆寫 setSymbolDisplay；回傳 true 表示已自行處理（跳過預設邏輯） */
    onSetSymbolDisplay?(ctx: ISlotReelContext, symbolView: ISlotReelSymbolView, icon: SpriteFrame, iconIndex: number, bgIcon: SpriteFrame | null, spIconActive: boolean): boolean | void;
    /** 覆寫 updateIcon；回傳 true 表示已自行處理（跳過預設邏輯） */
    onUpdateIcon?(ctx: ISlotReelContext, iconIndex: number, bgIndex: number | undefined, openSpIcon: boolean): boolean | void;
    /**
     * 設定長條圖標的顯示（各遊戲實作視覺客製化）
     * @param position 'first' | 'last'，表示該格在長條組內的位置
     * @param groupSize 長條圖標橫跨的格數（2/3/4）
     * @returns true 表示已自行處理
     */
    onSetTallSymbolDisplay?(ctx: ISlotReelContext, symbolView: ISlotReelSymbolView, tallInfo: ITallSymbolInfo, position: "first" | "last", groupSize: number, isBlur?: boolean): boolean | void;
    /** 重置長條圖標節點 */
    onResetTallSymbol?(ctx: ISlotReelContext, symbolView: ISlotReelSymbolView): void;
    /**
     * 滾動中隨機顯示長條圖標
     * @returns 長條配置，或 void 表示本次不顯示長條
     */
    updateRandTallIcon?(ctx: ISlotReelContext): {
        val: number;
        size: number;
        color: number;
    } | void;
}
//# sourceMappingURL=ISlotReelHooks.d.ts.map