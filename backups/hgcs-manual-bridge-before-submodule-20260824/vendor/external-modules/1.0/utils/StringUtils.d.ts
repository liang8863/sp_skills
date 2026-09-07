/**
 * 字串工具函數
 * 提供字串格式化、轉換等常用功能
 */
/**
 * 將字串或其他值轉換為布林值
 * @param value - 要轉換的值
 * @returns 布林值
 * @example
 * stringToBoolean("true") // true
 * stringToBoolean("1") // true
 * stringToBoolean("yes") // true
 * stringToBoolean("on") // true
 * stringToBoolean("false") // false
 * stringToBoolean("0") // false
 * stringToBoolean("") // false
 * stringToBoolean(null) // false
 * stringToBoolean(undefined) // false
 */
export declare function stringToBoolean(value: any): boolean;
/**
 * 格式化字串（類似 console.log 或 printf）
 * 支持的佔位符：
 * - %s: 字串
 * - %d: 數字（整數）
 * - %f: 浮點數
 * - %j: JSON 字串
 * - %o: 物件（使用 JSON.stringify）
 * - %%: 跳脫的 %
 *
 * @param template - 模板字串
 * @param args - 要插入的參數
 * @returns 格式化後的字串
 * @example
 * formatString("Hello %s", "World") // "Hello World"
 * formatString("Player %s has %d coins", "Alice", 100) // "Player Alice has 100 coins"
 * formatString("Value: %f", 3.14159) // "Value: 3.14159"
 * formatString("Data: %j", {name: "Bob"}) // "Data: {\"name\":\"Bob\"}"
 * formatString("100%% complete") // "100% complete"
 */
export declare function formatString(template: string, ...args: any[]): string;
//# sourceMappingURL=StringUtils.d.ts.map