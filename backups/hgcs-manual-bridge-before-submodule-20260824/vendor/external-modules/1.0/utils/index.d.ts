/**
 * UtilityTool - 通用工具庫
 *
 * 提供常用的工具函數，包括：
 * - 數字格式化（K/M/B、千分位、範圍限制）
 * - 字串工具（布林轉換、格式化）
 * - 函數工具（防抖、節流）
 *
 * @example
 * // 方式 1: 按需導入
 * import { formatNumber, stringToBoolean } from './utils';
 * formatNumber(1500000); // "1.5M"
 *
 * // 方式 2: 導入整個命名空間
 * import * as UtilityTool from './utils';
 * UtilityTool.formatNumber(1500000); // "1.5M"
 *
 * // 方式 3: 通過 ExternalModules（在遊戲中）
 * const { formatNumber } = window.ExternalModules;
 * formatNumber(1500000); // "1.5M"
 */
export { formatNumber, formatWithCommas, clamp } from "./NumberUtils";
export { stringToBoolean, formatString } from "./StringUtils";
export { debounce, throttle } from "./FunctionUtils";
export { splitArrayIntoSegments } from "./ArrayUtils";
export { CURRENCY_SYMBOLS, getCurrencySymbol, formatBetAmount } from "./CurrencyUtils";
//# sourceMappingURL=index.d.ts.map