import type { ISlotReelMgrView } from "./ISlotReelMgrView";
import type { ILogger } from "../../core/Logger/ILogger";
import type { ISlotReelMgrHooks, ISlotReelMgrContext } from "./ISlotReelMgrHooks";
import { SpriteFrame, Vec3, Node } from "cc";
/**
 * SlotReelMgr 抽象邏輯層
 *
 * 職責：管理所有轉軸的協調運作，包含旋轉、停輪、消除、掉落的整體流程控制
 * 透過 ISlotReelMgrView 接口存取 Cocos UI 元素和排程能力
 */
export declare class AbstractSlotReelMgrLogic {
    protected view: ISlotReelMgrView;
    protected logger: ILogger;
    protected hooks: Required<ISlotReelMgrHooks>;
    protected iconHeight: number;
    protected iconWidth: number;
    protected iconPadding: number;
    protected spinTime: number;
    protected peekingTime: number;
    protected highSpeedSpinTime: number;
    protected bounceDistance: number;
    protected bounceTime: number;
    protected peekingBounceTime: number;
    protected startDelayTime: number;
    protected clearDelayTime: number;
    protected dropDelayTime: number;
    protected speedDownTime: number;
    protected speed: number;
    protected startAniTime: number;
    protected startAniDelay: number;
    protected startAniBounceDistance: number;
    protected turboStartAniDelay: number;
    protected turboSpeed: number;
    protected turboSkipStartAni: boolean;
    protected turboDropPeeking: boolean;
    /** 极速模式下是否仍做停轮眯牌判定（默认 false = 维持现状：turbo 全轴秒停） */
    protected turboSpinPeeking: boolean;
    protected scatterID: number;
    /** 觸發瞇牌所需的 scatter 數量（達到此數量後，下一軸開始瞇牌） */
    protected peekingScatterThreshold: number;
    protected isCustomSequence: boolean;
    protected customSequence: number[][];
    protected isPeekingWhenDrop: boolean;
    protected dropPeekingDelay: number;
    protected dropPeekingReelDelay: number;
    /** 瞇牌掉落軸序方向：true = 左到右，false = 右到左（預設） */
    protected peekingDropLeftToRight: boolean;
    protected isSpin: boolean;
    /** 玩家是否在本輪手動點擊 SPIN 強制停輪（startSpin 時重置） */
    protected isManualStop: boolean;
    /** 是否呼叫過setSpinResult , setSingleReelSpinResult set*/
    protected isSpinResulted: boolean;
    /** setSpinResult 收到的完整結果列表（用於 stopSpin 時 flush 尚未派發的軸） */
    protected pendingSpinResult: number[][] | null;
    /** 各軸結果是否已透過 scheduleCallback 或 flush 實際送出 */
    protected reelResultDelivered: boolean[];
    /** stopSpin 在 setSpinResult 到來前被呼叫時設為 true，由 setSpinResult 延遲執行真正的停輪邏輯 */
    protected pendingManualStop: boolean;
    /** 開始瞇牌 Index */
    protected startPeekingIndex: number;
    protected nowScatterCount: number;
    protected spinStart: boolean[];
    protected spinOver: boolean[];
    protected dropOver: boolean[];
    protected isTurbo: boolean;
    protected maskPeekingPosXList: number[];
    protected maskDefultPos: Vec3;
    constructor(view: ISlotReelMgrView, logger: ILogger, hooks?: ISlotReelMgrHooks);
    /**
     * 建構 Hook 上下文物件
     */
    protected buildContext(): ISlotReelMgrContext;
    /** 失敗停輪事件匯流排（initialize 時取得；container 未就緒時為 null，功能靜默停用） */
    private stopReelSpinEventBus;
    /** 失敗停輪事件 handler 引用（destroy 時解除訂閱用） */
    private onStopReelSpinEvent;
    /**
     * 初始化（取代 Component.onLoad + start）
     */
    initialize(): void;
    /**
     * 銷毀
     */
    destroy(): void;
    /**
     * 失敗停輪：spin 失敗（結果永遠不會到來）時，以「各軸當前顯示盤面」餵入 setSpinResult，
     * 觸發 pendingManualStop 的同步 flush —— 全軸（含未起轉軸）停回原盤 → AllSpinOver 正常發，
     * 遊戲端停輪收尾（按鈕解鎖等）照常走。
     *
     * 冪等與順序安全：
     *   - isSpinResulted 已 true（真結果已到 / 已餵過）→ 不動，走正常流程；
     *   - 遊戲端 handler 先呼 stopSpin()（掛起 pendingManualStop）再進到此 → 旗標冪等重設後 flush；
     *   - 此處先跑、遊戲端後呼 stopSpin() → 彼時 isSpinResulted 已 true，stopSpin 走「結果已派發」
     *     分支對已停軸 no-op、滾動中軸加速急停，無害；
     *   - 任一軸尚無盤面快照（開局前異常路徑）→ 放棄餵盤，避免以空結果清空轉輪。
     */
    private stopSpinOnError;
    /**
     * 設定 Mask 預設位置
     */
    setMaskDefaultPos(pos: Vec3): void;
    /**
     * 初始化多語系圖標資源
     */
    initLanguageAssets(languageCode: string): void;
    getIconSpriteList(): SpriteFrame[];
    getBgSpriteFrameList(): SpriteFrame[];
    getItemPositionList(): Vec3[][];
    getSymbolViewList(): Node[][];
    protected setReelSpinTime(index: number, isPeeking: boolean): void;
    /** 設定全體盤面 */
    setAllSymbol(symbolList: number[][]): void;
    /**
     * 開始轉輪
     */
    startSpin(turboEnabled: boolean): void;
    /**
     * 設置轉輪結果
     */
    setSpinResult(iconsList: number[][]): void;
    setSingleReelSpinResult(iconsList: number[], index: number, isPeeking?: boolean): void;
    /**
     * 計算該輪的 Scatter 數量
     */
    protected checkScatterCount(reelIndex: number, currentIcons: number[]): number;
    stopSpin(): void;
    startClearShow(clearIndexList: number[][], changeSymbolClearIndexList: number[][], layout: number[][], isTurboMode: boolean): void;
    startDropShow(newResultList: number[][], isTurboMode: boolean): void;
    /**
     * 還原轉軸層級
     */
    protected adjustReelSorting(): void;
    protected allSpinOver(): void;
    protected spinCallBack(index: number): void;
    protected dropCallBack(index: number): void;
}
//# sourceMappingURL=AbstractSlotReelMgrLogic.d.ts.map