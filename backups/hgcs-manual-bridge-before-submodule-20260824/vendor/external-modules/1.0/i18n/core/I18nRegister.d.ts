/**
 * I18nRegister - i18n 翻譯註冊器
 *
 * 負責將 ext-module 的翻譯合併到 window.languages
 * 合併規則：ext-module 為底層，遊戲專案為優先覆蓋
 */
export declare class I18nRegister {
    /** ext-module 的翻譯資料 */
    private static translations;
    /** 是否已註冊 */
    private static registered;
    /**
     * 註冊 ext-module 翻譯到 window.languages
     *
     * 合併規則：
     * - ext-module 的翻譯作為底層
     * - 遊戲專案的翻譯（window.languages）優先覆蓋
     * - 深層合併，只覆蓋有定義的 key
     *
     * @example
     * ```typescript
     * // 在 ServiceBridge.initialize() 中呼叫
     * I18nRegister.register();
     * ```
     */
    static register(): void;
    /**
     * 檢查是否已註冊
     */
    static isRegistered(): boolean;
    /**
     * 取得支援的語系列表
     */
    static getSupportedLanguages(): string[];
    /**
     * 重置（用於測試）
     */
    static reset(): void;
    /**
     * 設定當前語言
     *
     * 呼叫此方法後，ExternalModules 內部的 t() 函數會使用指定語言
     *
     * @param lang 語言代碼 (例如 'en', 'zh')
     *
     * @example
     * ```typescript
     * // 在遊戲專案初始化時呼叫
     * I18nRegister.setCurrentLanguage('zh');
     * ```
     */
    static setCurrentLanguage(lang: string): void;
    /**
     * 从 container 取得 Logger（懒获取，ExternalModules 未就绪时返回 null）
     */
    private static getLogger;
}
//# sourceMappingURL=I18nRegister.d.ts.map