/**
 * NetworkService 接口定義
 *
 * 提供 HTTP 請求、錯誤處理、攔截器等功能
 */
/**
 * 請求配置
 */
export interface IRequestConfig {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, unknown>;
    data?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
    signal?: AbortSignal;
    showErrorToast?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    /**
     * 可选的请求级重试策略。由宿主 NetworkService 实现消费。
     */
    retry?: {
        maxRetries: number;
        delays: number[];
        retryableBusinessCodes?: number[];
        onAttempt?: (attempt: number, config: { data?: unknown }) => void;
    };
}
/**
 * 重試配置
 */
export interface IRetryConfig {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    retryableStatusCodes: number[];
}
/**
 * HTTP 響應結構
 */
export interface IResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}
/**
 * 請求攔截器
 */
export interface IRequestInterceptor {
    (config: IRequestConfig): IRequestConfig | Promise<IRequestConfig>;
}
/**
 * 響應攔截器
 */
export interface IResponseInterceptor {
    (response: IResponse): IResponse | Promise<IResponse>;
}
/**
 * NetworkService 主接口
 */
export interface INetworkService {
    /**
     * 發送 HTTP 請求（通用方法）
     *
     * @param config 請求配置
     * @returns Promise<IResponse<T>>
     *
     * @example
     * ```typescript
     * const response = await network.request({
     *   url: '/api/user',
     *   method: 'GET',
     *   params: { id: 123 }
     * });
     * ```
     */
    request<T = unknown>(config: IRequestConfig): Promise<IResponse<T>>;
    /**
     * GET 請求
     *
     * @param url 請求 URL
     * @param config 可選配置
     * @returns Promise<IResponse<T>>
     *
     * @example
     * ```typescript
     * const response = await network.get<UserData>('/api/user', {
     *   params: { id: 123 }
     * });
     * ```
     */
    get<T = unknown>(url: string, config?: Partial<IRequestConfig>): Promise<IResponse<T>>;
    /**
     * POST 請求
     *
     * @param url 請求 URL
     * @param data 請求數據
     * @param config 可選配置
     * @returns Promise<IResponse<T>>
     *
     * @example
     * ```typescript
     * const response = await network.post<LoginResponse>('/api/login', {
     *   username: 'user',
     *   password: 'pass'
     * });
     * ```
     */
    post<T = unknown>(url: string, data?: unknown, config?: Partial<IRequestConfig>): Promise<IResponse<T>>;
    /**
     * PUT 請求
     *
     * @param url 請求 URL
     * @param data 請求數據
     * @param config 可選配置
     * @returns Promise<IResponse<T>>
     */
    put<T = unknown>(url: string, data?: unknown, config?: Partial<IRequestConfig>): Promise<IResponse<T>>;
    /**
     * DELETE 請求
     *
     * @param url 請求 URL
     * @param config 可選配置
     * @returns Promise<IResponse<T>>
     */
    delete<T = unknown>(url: string, config?: Partial<IRequestConfig>): Promise<IResponse<T>>;
    /**
     * 添加請求攔截器
     *
     * @param interceptor 請求攔截器函數
     * @returns 移除函數
     *
     * @example
     * ```typescript
     * const remove = network.addRequestInterceptor((config) => {
     *   config.headers = { ...config.headers, 'X-Token': 'xxx' };
     *   return config;
     * });
     *
     * // 不需要時移除
     * remove();
     * ```
     */
    addRequestInterceptor(interceptor: IRequestInterceptor): () => void;
    /**
     * 添加響應攔截器
     *
     * @param interceptor 響應攔截器函數
     * @returns 移除函數
     *
     * @example
     * ```typescript
     * const remove = network.addResponseInterceptor((response) => {
     *   console.log('收到響應', response);
     *   return response;
     * });
     *
     * // 不需要時移除
     * remove();
     * ```
     */
    addResponseInterceptor(interceptor: IResponseInterceptor): () => void;
    /**
     * 設置 BaseURL（所有請求的前綴）
     *
     * @param baseURL 基礎 URL
     *
     * @example
     * ```typescript
     * network.setBaseURL('https://api.example.com');
     * await network.get('/user');  // 實際請求 https://api.example.com/user
     * ```
     */
    setBaseURL(baseURL: string): void;
    /**
     * 設置默認請求頭
     *
     * @param headers 請求頭
     *
     * @example
     * ```typescript
     * network.setDefaultHeaders({ 'Content-Type': 'application/json' });
     * ```
     */
    setDefaultHeaders(headers: Record<string, string>): void;
    /**
     * 設置默認超時時間
     *
     * @param timeout 超時時間（毫秒）
     *
     * @example
     * ```typescript
     * network.setDefaultTimeout(10000);  // 10 秒
     * ```
     */
    setDefaultTimeout(timeout: number): void;
    /**
     * 設置認證 Token
     *
     * @param token JWT token
     *
     * @example
     * ```typescript
     * network.setAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
     * ```
     */
    setAuthToken(token: string): void;
    /**
     * 清除認證 Token
     */
    clearAuthToken(): void;
    /**
     * 清除所有狀態
     * 包括：待處理的請求、攔截器、認證 Token
     *
     * @example
     * ```typescript
     * network.clearState();  // 遊戲切換時清理
     * ```
     */
    clearState(): void;
    /**
     * 設置默認重試配置
     *
     * @param config 重試配置
     *
     * @example
     * ```typescript
     * network.setRetryConfig({
     *   enabled: true,
     *   maxRetries: 3,
     *   retryDelay: 1000,
     *   retryableStatusCodes: [500, 502, 503, 504],
     * });
     * ```
     */
    setRetryConfig(config: IRetryConfig): void;
}
//# sourceMappingURL=INetworkService.d.ts.map
