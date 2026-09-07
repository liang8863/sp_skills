import type { SpriteFrame } from "cc";
/**
 * 長條圖標「框」資源配置
 *
 * 每個遊戲的框 SpriteFrame 不一樣，所以由遊戲端在 MgrView 上掛
 * `@property longFrameConfigs` 配置，logic 不假設任何框樣式。
 *
 * @example
 *   { frame: 1, spriteFrames: [silver1, silver2, silver3] }  // 銀框：1/2/3 格各一張
 *   { frame: 2, spriteFrames: [gold1, gold2, gold3], blurSpriteFrames: [...] }
 */
export interface ILongFrameConfig {
    /** 對應 decoded.frame（千位）的編號 */
    frame: number;
    /** 各 size 的 SpriteFrame；index = size - 1 */
    spriteFrames: SpriteFrame[];
    /** 模糊版（滾動中用）；缺省則 fallback 到 spriteFrames */
    blurSpriteFrames?: SpriteFrame[];
}
//# sourceMappingURL=ILongFrameConfig.d.ts.map