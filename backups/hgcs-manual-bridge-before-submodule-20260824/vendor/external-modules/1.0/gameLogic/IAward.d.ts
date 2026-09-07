/**
 * 后端 SpinResponse.snwm 元素的统一 schema
 *
 * 涵盖正常中奖与虚拟奖（如 MaxMultiCap）。游戏端 ResponseMapper 收到的原始 award 物件即为此型态。
 *
 * 参考：MaxMultiCap_frontend.md
 */
export interface IAward {
    /** 图标 code（一般为 int，前端有时以字串表示） */
    v: string | number;
    /** 奖项类型字串（如 "X3" / "MaxMultiCap"） */
    a: string;
    /** 命中次数 */
    c: number;
    /** 命中位置（虚拟奖为 null） */
    pos: number[] | null;
    /** 倍率（虚拟奖为 0） */
    wm: number;
    /** 派彩金额（decimal 字串；虚拟奖为 "0"） */
    wa: string;
    /** 倍率上限值（仅 MaxMultiCap 虚拟奖带） */
    ac?: number;
    /** 倍率金额（部分游戏带，固定 "0"） */
    wam?: string;
}
//# sourceMappingURL=IAward.d.ts.map