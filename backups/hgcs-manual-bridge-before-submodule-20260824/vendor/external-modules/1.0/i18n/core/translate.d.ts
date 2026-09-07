/**
 * ExternalModules 內部使用的翻譯函數
 *
 * 直接讀取 window.languages 取得翻譯
 * 與遊戲專案的 i18n 系統共用同一份翻譯數據
 */
/**
 * 設置當前語言
 * @param lang 語言代碼 (例如 'en', 'zh')
 */
export declare function setLanguage(lang: string): void;
/**
 * 取得當前語言
 */
export declare function getLanguage(): string;
/**
 * 翻譯函數
 *
 * @param key 翻譯 key (例如 'controlPanel.turboEnabled')
 * @returns 翻譯後的文字，找不到則返回 key
 *
 * @example
 * ```typescript
 * import { t } from '../i18n/core/translate';
 * import { COMMON_I18N_KEYS } from '../i18n/keys/CommonI18nKeys';
 *
 * const message = t(COMMON_I18N_KEYS.controlPanel.turboEnabled);
 * ```
 */
export declare function t(key: string): string;
//# sourceMappingURL=translate.d.ts.map