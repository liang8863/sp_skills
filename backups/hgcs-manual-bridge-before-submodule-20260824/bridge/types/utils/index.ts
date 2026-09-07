/**
 * Utils 工具函数类型定义
 */

/**
 * 数字工具函数类型
 */
export interface INumberUtils {
  /**
   * 将数字格式化为 K/M/B 缩写形式
   */
  formatNumber(value: number, decimals?: number): string;

  /**
   * 将数字格式化为千分位格式
   */
  formatWithCommas(value: number, decimals?: number): string;

  /**
   * 将数值限制在指定范围内
   */
  clamp(value: number, min: number, max: number): number;
}

/**
 * 字串工具函数类型
 */
export interface IStringUtils {
  /**
   * 将字串或其他值转换为布林值
   */
  stringToBoolean(value: any): boolean;

  /**
   * 格式化字串（类似 console.log 或 printf）
   */
  formatString(template: string, ...args: any[]): string;
}
/**
 * 阵列工具函数类型
 */
export interface IArrayUtils {
  splitArrayIntoSegments(originalArray: number[], segmentCount: number): number[][]
}

/**
 * 函数工具类型
 */
export interface IFunctionUtils {
  /**
   * 防抖函数
   */
  debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void;

  /**
   * 节流函数
   */
  throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void;
}

/**
 * 工具函数集合接口
 */
export interface IUtils extends INumberUtils, IStringUtils, IFunctionUtils, IArrayUtils { }
