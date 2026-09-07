/**
 * i18n 工具函數
 */
/**
 * 深層合併兩個物件
 *
 * @param target 目標物件（底層，會被覆蓋）
 * @param source 來源物件（優先，會覆蓋 target）
 * @returns 合併後的新物件
 *
 * @example
 * ```typescript
 * const ext = { common: { loading: 'Loading...', error: 'Error' } };
 * const game = { common: { loading: 'Please wait...' } };
 *
 * const result = deepMerge(ext, game);
 * // { common: { loading: 'Please wait...', error: 'Error' } }
 * ```
 */
export declare function deepMerge<T extends Record<string, unknown>>(target: T, source: T): T;
//# sourceMappingURL=utils.d.ts.map