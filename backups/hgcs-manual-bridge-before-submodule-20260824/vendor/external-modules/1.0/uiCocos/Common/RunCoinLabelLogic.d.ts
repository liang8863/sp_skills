import type { IRunCoinLabelView } from "./IRunCoinLabelView";
/**
 * RunCoinLabel 配置
 */
export interface RunCoinLabelConfig {
    /** 小数位数，默认 2 */
    decimalPlaces?: number;
    /** 自定义格式化函数（优先于 decimalPlaces） */
    formatter?: (value: number) => string;
}
/**
 * RunCoinLabel 逻辑层
 *
 * 职责：数字跑分动画的插值计算与 Label 更新（纯逻辑，不依赖 Cocos decorator）
 *
 * 使用方式（延迟初始化 — ExternalModules 是异步加载的）：
 * ```typescript
 * import type { RunCoinLabelLogic } from "../../bridge/types/uiCocos/Common";
 *
 * @ccclass('CustomRunCoinLabelView')
 * export class CustomRunCoinLabelView extends Component implements IRunCoinLabelView {
 *   @property(Label) label: Label = null!;
 *   private logic: RunCoinLabelLogic | null = null;
 *
 *   start() {
 *     const { RunCoinLabelLogic } = (window as any).ExternalModules;
 *     this.logic = new RunCoinLabelLogic(this);
 *   }
 *
 *   getLabel() { return this.label; }
 *
 *   playRunCoin(start: number, target: number, duration: number) {
 *     this.logic?.playRunCoin(start, target, duration);
 *   }
 *
 *   stopAndSetCoin(targetValue?: number) {
 *     this.logic?.stopAndSetCoin(targetValue);
 *   }
 *
 *   update(dt: number) {
 *     this.logic?.update(dt);
 *   }
 * }
 * ```
 */
export declare class RunCoinLabelLogic {
    private view;
    private _startValue;
    private _targetValue;
    private _currentValue;
    private _timer;
    private _duration;
    private _isAnimating;
    private _decimalPlaces;
    private _formatter?;
    constructor(view: IRunCoinLabelView, config?: RunCoinLabelConfig);
    get isAnimating(): boolean;
    get currentValue(): number;
    /**
     * 开始跑分动画
     * @param startValue  起始数值
     * @param targetValue 目标数值
     * @param duration    动画时长（秒）
     */
    playRunCoin(startValue: number, targetValue: number, duration: number): void;
    /**
     * 立即停止动画并设置最终数值
     * @param targetValue 最终显示数值；省略则清空 Label
     */
    stopAndSetCoin(targetValue?: number): void;
    /**
     * 帧推进（由 View 的 update(dt) 调用）
     */
    update(dt: number): void;
    private _formatValue;
}
//# sourceMappingURL=RunCoinLabelLogic.d.ts.map