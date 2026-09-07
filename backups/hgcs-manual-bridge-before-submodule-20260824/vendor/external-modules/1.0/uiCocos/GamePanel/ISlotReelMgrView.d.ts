import type { Node, SpriteFrame } from "cc";
import type { AbstractSlotReelLogic } from "./AbstractSlotReelLogic";
import type { ILongFrameConfig } from "./ILongFrameConfig";
/**
 * 多語系單個資源定義接口
 */
export interface ILanguageSpriteItem {
    index: number;
    spriteFrame: SpriteFrame;
}
/**
 * 多語系資源組定義接口
 */
export interface ILanguageSpriteConfig {
    lang: string;
    iconOverrides: ILanguageSpriteItem[];
    blurOverrides: ILanguageSpriteItem[];
    tallBaseOverrides?: ILanguageSpriteItem[];
    tallBaseBlurOverrides?: ILanguageSpriteItem[];
}
/**
 * SlotReelMgr View 接口
 *
 * 職責：提供轉輪管理器的 UI 元素訪問器、編輯器配置參數、Cocos 排程代理
 */
export interface ISlotReelMgrView {
    /**
     * 獲取管理器根節點
     */
    getNode(): Node;
    /** 圖標高度 */
    getIconHeight(): number;
    /** 圖標寬度（可選，橫向滾軸用） */
    getIconWidth?(): number;
    /** 圖標間距 */
    getIconPadding(): number;
    /** 旋轉時間 */
    getSpinTime(): number;
    /** 瞇牌時間 */
    getPeekingTime(): number;
    /** 高速旋轉時間 */
    getHighSpeedSpinTime(): number;
    /** 回彈距離 */
    getBounceDistance(): number;
    /** 回彈時間 */
    getBounceTime(): number;
    /** 瞇牌回彈時間 */
    getPeekingBounceTime(): number;
    /** 轉輪時間差 */
    getStartDelayTime(): number;
    /** 消除時間差（-1 = 使用 startDelayTime / 4） */
    getClearDelayTime(): number;
    /** 掉落時間差（-1 = 使用 startDelayTime / 2） */
    getDropDelayTime(): number;
    /** 降速準備停輪時間 */
    getSpeedDownTime(): number;
    /** 速度（每幀前進的距離） */
    getSpeed(): number;
    /** Scatter 代表 ID */
    getScatterID(): number;
    /** 觸發瞇牌所需的 scatter 數量（達此數量後，下一軸開始瞇牌；預設 2） */
    getPeekingScatterThreshold?(): number;
    /** 是否開啟客制轉輪順序 */
    getIsCustomSequence(): boolean;
    /** 轉輪順序組 */
    getCustomSequenceSetting(): number[][];
    /** 瞇牌掉落時各軸間延遲（未設定則使用 dropDelayTime） */
    getDropPeekingReelDelay?(): number;
    /** 瞇牌掉落軸序方向：true = 左到右，false/未設定 = 右到左（預設） */
    getPeekingDropLeftToRight?(): boolean;
    /** 開始動畫時間（秒） */
    getStartAniTime?(): number;
    /** 開始動畫延遲（秒） */
    getStartAniDelay?(): number;
    /** 開始動畫回彈距離（-1 = iconSpace * 0.3） */
    getStartAniBounceDistance?(): number;
    getTurboStartAniTime?(): number;
    getTurboSpeed?(): number;
    /** 極速模式下是否跳過 startAni（預設 false） */
    getTurboSkipStartAni?(): boolean;
    /** 極速模式掉落開啟瞇牌 */
    getTurboDropPeeking?(): boolean;
    /** 极速模式下是否仍做停轮眯牌判定：true = 达到 scatter 阈值后的轴延长慢停眯牌（阈值前的轴照 turbo 秒停）；false/未设定 = 维持现状（turbo 全轴秒停、不眯牌） */
    getTurboSpinPeeking?(): boolean;
    /** icon 圖標圖片資源列表 */
    getIconSpriteList(): SpriteFrame[];
    /** 背景圖標圖片資源列表 */
    getBgSpriteFrameList(): SpriteFrame[];
    /** 模糊圖標圖片資源列表 */
    getBlurIconList(): SpriteFrame[];
    /** 模糊圖標背板圖片資源列表 */
    getBlurBgList?(): SpriteFrame[];
    /** 長條底圖資源列表 */
    getTallBaseSpriteFrames?(): SpriteFrame[];
    /** 長條底圖模糊版資源列表 */
    getTallBaseBlurSpriteFrames?(): SpriteFrame[];
    /** LongSymbol：長條「框」資源配置（每遊戲框圖標不同時使用） */
    getLongFrameConfigs?(): ILongFrameConfig[];
    /** 各語言資源設定 */
    getLanguageConfigs(): ILanguageSpriteConfig[];
    /** 獲取所有轉軸 Logic 實例 */
    getReelLogicList(): AbstractSlotReelLogic[];
    /** 重複執行排程 */
    scheduleCallback(callback: (dt: number) => void, interval: number, repeat?: number, delay?: number): void;
    /** 延遲執行一次 */
    scheduleOnceCallback(callback: () => void, delay: number): void;
    /** 取消指定排程回調 */
    unscheduleCallback(callback: Function): void;
    /** 取消所有排程回調 */
    unscheduleAllCallbacks(): void;
}
//# sourceMappingURL=ISlotReelMgrView.d.ts.map