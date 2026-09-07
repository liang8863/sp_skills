import type { IDiscretePickerView } from "./IDiscretePickerView";
import type { ILogger } from "../../core/Logger/ILogger";
/**
 * 離散選擇器配置
 */
export interface DiscretePickerConfig {
    /**
     * 每個選項的間距 (像素)
     */
    itemSpacing: number;
    /**
     * 吸附動畫時長 (秒)
     */
    snapDuration: number;
    /**
     * 有效選項起始索引 (排除上方 '-')
     */
    validStartIndex: number;
    /**
     * 有效選項結束索引 (排除下方 '-')
     */
    validEndIndex: number;
}
/**
 * 離散選擇器邏輯層 (類似 iOS Picker)
 *
 * 特性:
 * - 垂直拖曳選擇
 * - 自動吸附到最近的選項
 * - 無慣性滾動
 * - 效能優化
 */
export declare class DiscretePickerLogic {
    private view;
    private logger;
    private config;
    private currentIndex;
    private isDragging;
    private currentOffset;
    /**
     * 值改變回調
     * @param index 選中的索引
     * @param value 選中的值 (Label.string)
     */
    onValueChanged: ((index: number, value: string) => void) | null;
    /**
     * 滑動狀態改變回調（拖曳中或吸附動畫期間為 true）
     */
    onSlidingStateChanged: ((isSliding: boolean) => void) | null;
    private isSliding;
    constructor(view: IDiscretePickerView, logger: ILogger, config?: Partial<DiscretePickerConfig>);
    /**
     * 初始化
     */
    initialize(): void;
    /**
     * 銷毀
     */
    destroy(): void;
    /**
     * 設定當前選中的索引（程式呼叫，靜默不觸發 onValueChanged）
     * @param index 索引 (validStartIndex ~ validEndIndex)
     * @param animated 是否使用動畫
     */
    setIndex(index: number, animated?: boolean): void;
    /**
     * 獲取當前選中的索引
     */
    getIndex(): number;
    /**
     * 獲取當前選中的值
     */
    getValue(): string;
    /**
     * 設定選項數據 (動態更新)
     * @param values 選項值數組 (不包含上下的 '-')
     */
    setOptions(values: string[]): void;
    /**
     * 動態創建選項節點（從模板複製）
     */
    private createItemsFromTemplate;
    /**
     * 更新現有選項節點（靜態模式）
     */
    private updateExistingItems;
    /**
     * 更新滑動狀態並觸發回調
     */
    private setSlidingState;
    /**
     * 驗證必要屬性
     */
    private validateProperties;
    /**
     * 註冊觸摸事件
     */
    private registerTouchEvents;
    /**
     * 取消註冊觸摸事件
     */
    private unregisterTouchEvents;
    /**
     * 觸摸開始
     */
    private onTouchStart;
    /**
     * 觸摸移動
     */
    private onTouchMove;
    /**
     * 觸摸結束
     */
    private onTouchEnd;
    /**
     * 更新所有 Item 的位置
     */
    private updateItemPositions;
    /**
     * 吸附到指定索引
     * @param index 目標索引
     * @param animated 是否使用動畫
     * @param silent 是否靜默（不觸發 onValueChanged，預設 false：使用者觸控結束會觸發）
     */
    private snapToIndex;
}
//# sourceMappingURL=DiscretePicker.d.ts.map