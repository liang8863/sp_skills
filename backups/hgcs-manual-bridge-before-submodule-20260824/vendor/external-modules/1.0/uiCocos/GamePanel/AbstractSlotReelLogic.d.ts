import type { ISlotReelView } from "./ISlotReelView";
import type { ISlotReelSymbolView } from "./ISlotReelSymbolView";
import type { ILogger } from "../../core/Logger/ILogger";
import type { ISlotReelHooks, ISlotReelContext } from "./ISlotReelHooks";
import { SpriteFrame, Vec3, Node } from "cc";
/**
 * 轉輪狀態列舉
 */
export declare const enum SlotStateEnum {
    NONE = 0,
    STARTSPIN = 1,
    WAIT_RESULT = 2,
    SPINING = 3,
    PEEKING = 4,
    STOP = 5,
    ENDING = 6
}
/**
 * 圖標映射結果
 */
export interface IconMappingResult {
    /** 圖標資源 array 的 index */
    iconIndex: number;
    /** 背景 array 的 index */
    backgroundIndex: number | null;
}
/**
 * SlotReel 抽象邏輯層
 *
 * 職責：提供單一轉軸的核心旋轉、停止、消除、掉落邏輯
 * 透過 ISlotReelView 接口存取 Cocos UI 元素和排程能力
 */
export declare class AbstractSlotReelLogic {
    protected view: ISlotReelView;
    protected logger: ILogger;
    protected hooks: Required<ISlotReelHooks>;
    reelIndex: number;
    /** 圖標高度 */
    protected iconHeight: number;
    /** 圖標寬度 */
    protected iconWidth: number;
    /** 圖標間距 */
    protected iconPadding: number;
    /** 是否為橫向滾軸（預設關閉） */
    protected isHorizontal: boolean;
    /** 旋轉時間 */
    protected spinTime: number;
    /** 瞇牌降速時間 */
    protected peekingTime: number;
    /** 速度（每幀前進的距離） */
    protected speed: number;
    /** 回彈距離 */
    protected bounceDistance: number;
    /** 回彈時間 */
    protected bounceTime: number;
    /** 瞇牌回彈時間 */
    protected peekingBounceTime: number;
    /** 開始動畫時間（秒，預設同 bounceTime） */
    protected startAniTime: number;
    /** 開始動畫延遲（秒，預設同 bounceTime） */
    protected startAniDelay: number;
    /** 開始動畫回彈距離（預設同 bounceDistance） */
    protected startAniBounceDistance: number;
    /** 掉落動畫持續時間 (秒) */
    protected dropDuration: number;
    /** 開始動畫延遲（秒，預設同 bounceTime） */
    protected turboStartAniDelay: number;
    /** 速度（每幀前進的距離） */
    protected turboSpeed: number;
    /** 極速模式下是否跳過 startAni */
    protected turboSkipStartAni: boolean;
    /** 圖標圖片資源列表 */
    protected iconSpriteFrameList: SpriteFrame[];
    protected bgSpriteFrameList: SpriteFrame[];
    protected blurIconList: SpriteFrame[];
    /** 瞇牌時是否保持模糊圖 */
    protected peekingBlur: boolean;
    /** 實際圖標空間 */
    protected iconSpace: number;
    /** 轉輪計時器 */
    protected spinTimer: number;
    /** 本次結果 */
    protected result: number[];
    /** 是否正在動作 */
    protected isSpin: boolean;
    /** 滾輪狀態 */
    protected spinState: SlotStateEnum;
    /** 当前显示盘面（setAllSymbol 时记录，供 spin 失败无结果时停回原盘面用） */
    protected currentSymbols: number[];
    /** 現在轉輪滾到的位置標示 */
    protected nowIndex: number;
    /** 轉輪原始位置 */
    protected reelDefultPos: Vec3;
    /** Reel 自身 Z 軸旋轉角度（度数），由 initialize 時偵測；無旋轉時為 0 */
    protected tiltAngleZ: number;
    /** 目標位置 */
    protected targetIndex: number;
    /** 圖標種類數量 */
    protected totalIcons: number;
    /** 是否瞇牌 */
    protected isPeeking: boolean;
    /** 現在速度 */
    protected nowSpeed: number;
    protected pendingQuickStop: boolean;
    /** 已墜落完畢圖標計數 */
    protected dropCompleteCount: number;
    /** 墜落完畢回調 */
    protected dropOverCallBack: Function | null;
    private currentModeStartAniDelay;
    private currentModeSpeed;
    /** 綁定的 update 回調引用 */
    private updateBound;
    /** Symbol View 列表（運行時可能被重排序的工作副本） */
    protected symbolViewList: ISlotReelSymbolView[];
    constructor(view: ISlotReelView, logger: ILogger, hooks?: ISlotReelHooks);
    /**
     * 建構 Hook 上下文物件
     */
    protected buildContext(): ISlotReelContext;
    /** 取得 View 節點（供外部如 MgrLogic 監聽事件用） */
    getViewNode(): Node;
    /** 取得圖標間距（橫向用 iconWidth，垂直用 iconHeight） */
    protected getIconSpace(): number;
    /** 取得位移軸的值（橫向=x，垂直=y） */
    protected getForward(pos: Vec3): number;
    /**
     * 偵測 reel 節點 Z 軸旋轉角度（度数）。
     * 直接讀 node.eulerAngles.z，無依賴任何可選 engine module。
     */
    protected detectTiltAngleZ(node: Node): number;
    /** 若專案運行時動態改了 rotation，可呼叫此方法重新偵測 */
    refreshTiltAngle(): void;
    /** 建立位移方向的向量（保留另一軸的值） */
    protected makeForwardPos(forward: number, base?: Vec3): Vec3;
    /**
     * 计算 reel-root 在 parent frame 的目标位置（含旋转补偿）。
     * 与 makeForwardPos 区别：此方法用于 reel-root 自身的移动（rolling、startAni、stopAni），
     * 补偿后 motion 沿着 reel 自身 Z 轴旋转的 -Y 方向走。
     * Symbol 的 local 位置请用 makeForwardPos（不要补偿，视觉旋转由 parent transform 提供）。
     */
    protected makeReelForwardPos(forward: number, base?: Vec3): Vec3;
    /** 建立 symbol 的排列位置（垂直：往負Y；橫向：往正X） */
    protected makeSymbolPos(index: number): Vec3;
    /**
     * 初始化（取代 Component.onLoad）
     */
    initialize(): void;
    /**
     * 銷毀（取代 Component.onDestroy）
     */
    destroy(): void;
    /**
     * 重置轉輪各種參數
     */
    reset(): void;
    /**
     * 初始化各種設定
     */
    initReelSetting(reelIndex: number, iconList: SpriteFrame[], bgIconList: SpriteFrame[], blurIconList: SpriteFrame[], iconHeight: number, iconPadding: number, speed: number, bounceDistance: number, bounceTime: number, peekingBounceTime: number, iconWidth?: number, startAniTime?: number, startAniDelay?: number, startAniBounceDistance?: number, turboStartAniDelay?: number, turboSpeed?: number, turboSkipStartAni?: boolean): void;
    setPeekingBlur(enabled: boolean): void;
    /** 設定開始動畫參數 */
    setStartAniConfig(time: number, delay: number, bounceDistance?: number): void;
    setSpinTime(spinTime: number, speedDownTime: number, isPeeking: boolean): void;
    getSymbolPositionList(): Vec3[];
    getSymbolViewList(): Node[];
    isInPeekingState(): boolean;
    /**
     * 批量設定所有圖標的結果
     * @param resultList 結果列表
     * @param isInitial 是否為初始盤面
     */
    setAllSymbol(resultList: number[], isInitial?: boolean): void;
    /**
     * 設定單個 Symbol 的顯示
     */
    protected setSymbolDisplay(symbolView: ISlotReelSymbolView, icon: SpriteFrame, iconIndex: number, bgIcon?: SpriteFrame | null, spIconActive?: boolean): void;
    /**
     * 遊戲資料轉換
     */
    protected getIconAndBgIndex(resultIndex: number): IconMappingResult;
    /** 開始轉輪 */
    startSpin(turboEnabled?: boolean): void;
    setSpinResult(result: number[]): void;
    /** 取得當前顯示盤面快照（MgrLogic 失敗停輪以原盤餵結果用；未設定過時為空陣列） */
    getCurrentSymbols(): number[];
    /** 手動停輪 */
    stopSpin(): void;
    /**
     * 開始消除行為
     */
    startClearSequence(dropIndexList: number[], layout: number[], changeDropIndexList?: number[] | null): void;
    /** 掉落序列 */
    startDropSequence(newResultList: number[], onComplete?: (reelIndex: number) => void, isPeeking?: boolean, peekingReelOffset?: number): void;
    /**
     * 初始化圖案的位置
     */
    protected initializePositions(): void;
    /** 切換至結束狀態 */
    protected checkToStopState(): void;
    /** 開始反彈表演 */
    protected startAni(): void;
    /** startAni 結束後的狀態轉換（或跳過 startAni 時直接呼叫） */
    protected onStartAniComplete(): void;
    /** 結束時的通用清理 */
    protected finishSpin(): void;
    /** 結尾反彈表演 */
    protected stopAni(): void;
    /** 調整圖層順序 */
    protected adjustSymbolSorting(): void;
    /**
     * 跑隨機圖標
     */
    protected updateRandIcon(): void;
    /**
     * 將移出畫面外的圖標移回最上並更換圖片
     */
    protected updateIcon(iconIndex: number, bgIndex?: number, openSpIcon?: boolean): void;
    /**
     * 處理消除表現
     */
    protected dropSymbolPerformance(clearIndexList: number[], changeDropIndexList: number[] | null, changeSymbolCode: number | null, changeSymbolIconIndex: number | null): void;
    protected animateDropToPosition(targetNode: Node, targetPosition: Vec3, onComplete?: () => void): void;
    protected overDropCallBack(index: number, symbolCode: number, shouldPlayIdleOnly: boolean): void;
    protected allDropOverCallBack(): void;
    protected update(dt: number): void;
}
//# sourceMappingURL=AbstractSlotReelLogic.d.ts.map