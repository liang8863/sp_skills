/**
 * Logger 接口定義
 *
 * 統一的日誌記錄接口，支持不同日誌級別
 * 所有遊戲共用同一個 Logger 實例
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}
export interface ILogger {
    /**
     * 設置日誌級別
     */
    setLevel(level: LogLevel): void;
    /**
     * 獲取當前日誌級別
     */
    getLevel(): LogLevel;
    /**
     * 調試日誌（開發環境）
     */
    debug(message: string, ...args: any[]): void;
    /**
     * 信息日誌（一般信息）
     */
    info(message: string, ...args: any[]): void;
    /**
     * 警告日誌（需要注意的問題）
     */
    warn(message: string, ...args: any[]): void;
    /**
     * 錯誤日誌（嚴重問題）
     */
    error(message: string, ...args: any[]): void;
    /**
     * 分組開始
     */
    group(label: string): void;
    /**
     * 分組結束
     */
    groupEnd(): void;
}
//# sourceMappingURL=ILogger.d.ts.map