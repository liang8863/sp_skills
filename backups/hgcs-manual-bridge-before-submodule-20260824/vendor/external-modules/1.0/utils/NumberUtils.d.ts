/**
 * 數字工具函數
 * 提供數字格式化、範圍限制等常用功能
 */
/**
 * 將數字格式化為 K/M/B 縮寫形式
 * @param value - 要格式化的數字
 * @param decimals - 小數位數（預設 1）
 * @returns 格式化後的字串
 * @example
 * formatNumber(1000) // "1K"
 * formatNumber(1500) // "1.5K"
 * formatNumber(1500000) // "1.5M"
 * formatNumber(2300000000) // "2.3B"
 * formatNumber(1234, 2) // "1.23K"
 */
export declare function formatNumber(value: number, decimals?: number): string;
/**
 * 將數字格式化為千分位格式
 * @param value - 要格式化的數字
 * @param decimals - 小數位數（預設 0）
 * @returns 格式化後的字串
 * @example
 * formatWithCommas(1000) // "1,000"
 * formatWithCommas(1500000) // "1,500,000"
 * formatWithCommas(1234.56, 2) // "1,234.56"
 */
export declare function formatWithCommas(value: number, decimals?: number): string;
/**
 * 將數值限制在指定範圍內
 * @param value - 要限制的數值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制後的數值
 * @example
 * clamp(150, 0, 100) // 100
 * clamp(-10, 0, 100) // 0
 * clamp(50, 0, 100) // 50
 */
export declare function clamp(value: number, min: number, max: number): number;
//# sourceMappingURL=NumberUtils.d.ts.map