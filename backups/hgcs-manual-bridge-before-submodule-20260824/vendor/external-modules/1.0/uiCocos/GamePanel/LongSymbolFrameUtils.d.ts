import type { SpriteFrame } from "cc";
import type { ILongFrameConfig } from "./ILongFrameConfig";
/**
 * 從 ILongFrameConfig[] 中查出對應 frame + size 的 SpriteFrame
 *
 * 查不到回傳 null（呼叫端決定 fallback 行為）。
 * isBlur=true 時優先用 blurSpriteFrames，若該 config 沒提供則 fallback 到普通版。
 */
export declare function findLongFrameSprite(configs: readonly ILongFrameConfig[], frame: number, size: number, isBlur?: boolean): SpriteFrame | null;
//# sourceMappingURL=LongSymbolFrameUtils.d.ts.map