/**
 * 網路錯誤類別定義
 *
 * 提供三層錯誤處理：
 * 1. HttpError - HTTP 狀態碼錯誤（4xx/5xx）
 * 2. NetworkError - 網路錯誤（timeout/offline/abort）
 * 3. BusinessError - 業務錯誤（服務端返回 code !== 0）
 */
/**
 * 基礎網路錯誤類別
 * 所有網路相關錯誤的基類
 */
export declare abstract class BaseNetworkError extends Error {
    readonly timestamp: number;
    readonly url: string;
    readonly method: string;
    constructor(message: string, url: string, method: string);
    /**
     * 獲取日誌訊息（供 Logger 使用）
     */
    abstract getLogMessage(): string;
    /**
     * 獲取用戶可見訊息（供 Toast 使用）
     */
    abstract getUserMessage(): string;
}
/**
 * HTTP 錯誤（4xx/5xx 狀態碼）
 *
 * @example
 * ```typescript
 * throw new HttpError(404, 'Not Found', null, '/api/user', 'GET');
 * ```
 */
export declare class HttpError extends BaseNetworkError {
    readonly status: number;
    readonly statusText: string;
    readonly response: any;
    constructor(status: number, statusText: string, response: any, url: string, method: string);
    getLogMessage(): string;
    getUserMessage(): string;
}
/**
 * 網路錯誤（連線失敗、超時、取消）
 *
 * @example
 * ```typescript
 * throw new NetworkError('請求超時', 'TIMEOUT', '/api/data', 'POST');
 * ```
 */
export declare class NetworkError extends BaseNetworkError {
    readonly code: 'TIMEOUT' | 'NETWORK_ERROR' | 'ABORT';
    constructor(message: string, code: 'TIMEOUT' | 'NETWORK_ERROR' | 'ABORT', url: string, method: string);
    getLogMessage(): string;
    getUserMessage(): string;
}
/**
 * 業務錯誤（服務端返回 code !== 0）
 *
 * @example
 * ```typescript
 * throw new BusinessError(1001, '餘額不足', null, '/api/spin', 'POST');
 * ```
 */
export declare class BusinessError<T = unknown> extends BaseNetworkError {
    readonly code: number;
    readonly serverMessage: string;
    readonly data: T;
    constructor(code: number, serverMessage: string, data: T, url: string, method: string);
    getLogMessage(): string;
    getUserMessage(): string;
}
//# sourceMappingURL=NetworkError.d.ts.map