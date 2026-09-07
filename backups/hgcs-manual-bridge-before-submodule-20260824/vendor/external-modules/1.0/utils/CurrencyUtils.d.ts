/**
 * 貨幣符號對照表（18 種幣別）
 *
 * 來源：後端 /v1/gamecenter/bets 回傳的 currency 代號
 */
export declare const CURRENCY_SYMBOLS: Record<string, string>;
/**
 * 取得幣別符號；未知幣別回傳空字串
 */
export declare function getCurrencySymbol(currency: string | undefined | null): string;
/**
 * 格式化下注金額（前綴貨幣符號 + 兩位小數）
 * @example formatBetAmount(10, "CNY") // "¥10.00"
 * @example formatBetAmount(10, "XXX") // "10.00"（未知幣別）
 */
export declare function formatBetAmount(amount: number, currency: string | undefined | null, decimals?: number): string;
//# sourceMappingURL=CurrencyUtils.d.ts.map