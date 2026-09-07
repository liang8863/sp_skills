/**
 * 函數工具
 * 提供防抖、節流等常用功能
 */
/**
 * 防抖函數（Debounce）
 * 在事件被觸發 n 秒後再執行回調，如果在這 n 秒內又被觸發，則重新計時
 * 適用場景：搜尋輸入框、視窗 resize 事件
 *
 * @param fn - 要執行的函數
 * @param delay - 延遲時間（毫秒）
 * @returns 防抖後的函數
 * @example
 * const searchInput = debounce((keyword) => {
 *   console.log("搜尋:", keyword);
 * }, 300);
 *
 * // 使用者快速輸入 "abc"，只會在停止輸入 300ms 後執行一次
 * searchInput("a");
 * searchInput("ab");
 * searchInput("abc"); // 只有這次會執行
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * 節流函數（Throttle）
 * 無論事件觸發多頻繁，保證在指定時間內只執行一次
 * 適用場景：滾動事件、按鈕連點防護
 *
 * @param fn - 要執行的函數
 * @param delay - 節流時間（毫秒）
 * @returns 節流後的函數
 * @example
 * const onScroll = throttle(() => {
 *   console.log("滾動事件");
 * }, 200);
 *
 * window.addEventListener("scroll", onScroll);
 * // 無論滾動多快，每 200ms 最多執行一次
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=FunctionUtils.d.ts.map