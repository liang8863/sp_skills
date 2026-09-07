import { SpriteFrame } from "cc";
import type { IMarqueeBarView } from "./IMarqueeBarView";
import type { ILogger } from "../../core/Logger/ILogger";
/**
 * 跑馬燈內容類型
 */
export type MarqueeContentType = "text" | "image";
/**
 * 文字內容項目
 */
export interface IMarqueeTextItem {
    type: "text";
    text: string;
}
/**
 * 圖片內容項目
 */
export interface IMarqueeImageItem {
    type: "image";
    spriteFrame: SpriteFrame;
}
/**
 * 跑馬燈內容項目（聯合類型）
 */
export type MarqueeContentItem = IMarqueeTextItem | IMarqueeImageItem;
/**
 * 跑馬燈配置參數（構造時設定）
 */
export interface IMarqueeConfig {
    /** 滾動速度（像素/秒） */
    scrollSpeed?: number;
    /** 單個 Label 最大寬度（像素）- Cocos Canvas 渲染限制 */
    maxLabelWidth?: number;
    /** 內容項目間距（像素） */
    itemGap?: number;
    /** 滾動前停留時間（秒）- 首次滾動前的延遲 */
    scrollStayTime?: number;
    /** 靜態顯示時間（秒）- 內容不需滾動時的顯示時長 */
    staticDisplayTime?: number;
    /** 滾動起始位置像素偏移（正值往右、負值往左，預設 0） */
    scrollStartOffset?: number;
    /** 滾動結束位置像素偏移（正值往左、負值往右，預設 0） */
    scrollEndOffset?: number;
    /** 滾動初始停頓時間（秒）- 較長跑馬燈首次開始滾動前的一次性停頓，預設 0 */
    scrollPauseTime?: number;
}
/**
 * 播放選項（每次播放時設定）
 */
export interface IMarqueePlayOptions {
    /** 是否循環播放（預設 true） */
    loop?: boolean;
    /** 播放完成回調（非 loop 模式或停止時觸發） */
    onComplete?: () => void;
}
/**
 * 停止選項
 */
export interface IMarqueeStopOptions {
    /** 是否立即停止（預設 true）。false = 播完當前這一輪才停止 */
    immediate?: boolean;
}
/**
 * MarqueeBar 抽象邏輯層（圖文混合版）
 *
 * 職責：提供跑馬燈的基礎邏輯，支持文字、圖片、圖文混合
 *
 * 核心概念：
 * - 滾動的是「內容容器」（ContentContainer），而非單個 Label/Sprite
 * - 容器內動態創建內容（Label 或 Sprite）
 * - 無縫循環：內容首尾相接，連續滾動
 *
 * 使用範例：
 * ```typescript
 * // 純文字
 * logic.startMixedCarousel([
 *   { type: 'text', text: "歡迎來到遊戲！" }
 * ]);
 *
 * // 純圖片
 * logic.startMixedCarousel([
 *   { type: 'image', spriteFrame: bannerA },
 *   { type: 'image', spriteFrame: bannerB },
 * ]);
 *
 * // 圖文混合
 * logic.startMixedCarousel([
 *   { type: 'text', text: "最新公告：" },
 *   { type: 'image', spriteFrame: eventBanner },
 *   { type: 'text', text: "活動時間：1/1 - 1/31" },
 * ]);
 * ```
 */
export declare abstract class AbstractMarqueeBarLogic {
    protected view: IMarqueeBarView;
    protected logger: ILogger;
    /** 滾動速度（像素/秒） */
    protected scrollSpeed: number;
    /** 單個 Label 最大寬度（像素）- Cocos Canvas 渲染限制 */
    protected maxLabelWidth: number;
    /** 內容項目間距（像素） */
    protected itemGap: number;
    /** 滾動前停留時間（秒） */
    protected scrollStayTime: number;
    /** 靜態顯示時間（秒） */
    protected staticDisplayTime: number;
    /** 滾動起始位置像素偏移（正值往右、負值往左） */
    protected scrollStartOffset: number;
    /** 滾動起始位置像素偏移（正值往左、負值往右） */
    protected scrollEndOffset: number;
    /** 滾動初始停頓時間（秒）- 較長跑馬燈首次開始滾動前的一次性停頓 */
    protected scrollPauseTime: number;
    /** 當前內容項目列表 */
    private contentItems;
    /** Mask 可視區域寬度 */
    private maskWidth;
    /** 當前滾動 tween */
    private scrollTween;
    /** 動態創建的內容節點（用於清理） */
    private createdNodes;
    /** 內容容器 A（主容器） */
    private containerA;
    /** 內容容器 B（副本容器，用於無縫銜接） */
    private containerB;
    /** 單組內容的總寬度 */
    private singleContentWidth;
    /** ContentContainer 的縮放倍率 */
    private containerScale;
    /** 是否正在滾動 */
    private isScrolling;
    /** 是否循環播放 */
    private isLoop;
    /** 播放完成回調 */
    private onCompleteCallback;
    /** 是否等待播完才停止 */
    private pendingStop;
    /** 靜態顯示計時器 ID */
    private staticDisplayTimerId;
    /** 滾動初始停頓計時器 ID */
    private scrollPauseTimerId;
    constructor(view: IMarqueeBarView, logger: ILogger, config?: IMarqueeConfig);
    /**
     * 開始圖文混合輪播
     * @param items 內容項目列表（文字或圖片）
     * @param options 播放選項（loop, onComplete）
     */
    startMixedCarousel(items: MarqueeContentItem[], options?: IMarqueePlayOptions): void;
    /**
     * 設置單條文字（向下兼容 API）
     * @param message 要顯示的訊息
     */
    setMessage(message: string): void;
    /**
     * 開始文字輪播（向下兼容 API）
     * 注意：新版統一為單條重複模式，textList 會合併為一條
     * @param textList 文字列表
     */
    startCarousel(textList: string[]): void;
    /**
     * 停止輪播
     * @param options 停止選項。immediate=true 立即停止，immediate=false 播完當前才停止
     */
    stopCarousel(options?: IMarqueeStopOptions): void;
    /**
     * 顯示組件
     */
    show(): void;
    /**
     * 隱藏組件
     */
    hide(): void;
    /**
     * 初始化
     */
    initialize(): void;
    /**
     * 銷毀（清理資源）
     */
    destroy(): void;
    /**
     * 更新 Mask 寬度
     */
    private updateMaskWidth;
    /**
     * 構建內容並開始滾動
     */
    private buildContentAndScroll;
    /**
     * 創建內容節點（Label 或 Sprite）
     */
    private createContentNode;
    /**
     * 創建文字節點
     */
    private createTextNode;
    /**
     * 創建圖片節點
     */
    private createImageNode;
    /**
     * 內容居中顯示（不滾動）
     */
    private centerContent;
    /**
     * 開始滾動動畫
     * 新邏輯：從左邊開始顯示，滾動到完全離開後結束或循環
     */
    private startScrollAnimation;
    /**
     * 執行滾動動畫
     * @param isFirstScroll 是否為首次滾動（需要延遲）
     */
    private performScroll;
    /**
     * 滾動完成處理
     */
    private onScrollComplete;
    /**
     * 播放完成處理
     */
    private handlePlayComplete;
    /**
     * 清理動態創建的節點
     */
    private cleanupCreatedNodes;
}
//# sourceMappingURL=AbstractMarqueeBarLogic.d.ts.map