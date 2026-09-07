/**
 * ExternalModules 共用 i18n Key 常量
 *
 * 用途：
 * - 提供所有遊戲共用的 i18n key 定義
 * - 類型安全、IDE 自動補全
 * - ExternalModules 內部和遊戲專案都可使用
 *
 * ExternalModules 內部使用：
 * ```typescript
 * import { COMMON_I18N_KEYS } from '../i18n/keys/CommonI18nKeys';
 * i18n.t(COMMON_I18N_KEYS.common.confirm);
 * ```
 *
 * 遊戲專案使用：
 * ```typescript
 * const { COMMON_I18N_KEYS } = window.ExternalModules;
 * i18n.t(COMMON_I18N_KEYS.common.confirm);
 * ```
 *
 * 遊戲專案擴展（繼承 + 新增）：
 * ```typescript
 * // 遊戲專案的 I18nKeys.ts
 * const { COMMON_I18N_KEYS } = window.ExternalModules;
 *
 * export const I18N_KEYS = {
 *   ...COMMON_I18N_KEYS,
 *   // 遊戲專屬 key
 *   oddPanel: {
 *     wild: 'oddPanel.wild',
 *   },
 * } as const;
 * ```
 *
 * 維護指南：
 * - 此檔案定義的 key 必須與 languages/en.ts, zh.ts 同步
 * - 只放所有遊戲共用的 key，遊戲專屬 key 放在各遊戲專案
 */
/**
 * 通用 key
 */
declare const COMMON_KEYS: {
    /** 確認按鈕 */
    readonly confirm: "common.confirm";
    /** 取消按鈕 */
    readonly cancel: "common.cancel";
    /** 離開遊戲按鈕 */
    readonly quitGame: "common.quitGame";
};
/**
 * Loading 相關 key
 */
declare const LOADING_KEYS: {
    /** 開始遊戲按鈕 */
    readonly getStarted: "loading.getStarted";
    /** 載入資源中 */
    readonly loadingResources: "loading.loadingResources";
};
/**
 * 控制面板 key
 */
declare const CONTROL_PANEL_KEYS: {
    /** 極速旋轉已開啟 */
    readonly turboEnabled: "controlPanel.turboEnabled";
    /** 極速旋轉已關閉 */
    readonly turboDisabled: "controlPanel.turboDisabled";
};
/**
 * 自動旋轉面板 key
 */
declare const AUTO_SPIN_KEYS: {
    /** 面板標題 */
    readonly title: "autoSpin.title";
    /** 自動旋轉次數 */
    readonly autoSpinCount: "autoSpin.autoSpinCount";
    /** 開始自動旋轉按鈕 */
    readonly startAutoSpin: "autoSpin.startAutoSpin";
};
/**
 * 下注面板 key
 */
declare const BET_PANEL_KEYS: {
    /** 面板標題 */
    readonly title: "betPanel.title";
    /** 單注金額 */
    readonly betSize: "betPanel.betSize";
    /** 投注倍數 */
    readonly betLevel: "betPanel.betLevel";
    /** 基礎投注 */
    readonly baseBet: "betPanel.baseBet";
    /** 投注總額 */
    readonly betAmount: "betPanel.betAmount";
    /** 投注線 */
    readonly betLine: "betPanel.betLine";
    /** 最大投注 */
    readonly maxBet: "betPanel.maxBet";
};
/**
 * 選單面板 key
 */
declare const MENU_KEYS: {
    /** 退出 */
    readonly quit: "menu.quit";
    /** 聲音 */
    readonly sound: "menu.sound";
    /** 賠付表 */
    readonly paytable: "menu.paytable";
    /** 規則 */
    readonly rules: "menu.rules";
    /** 歷史 */
    readonly history: "menu.history";
    /** 關閉 */
    readonly close: "menu.close";
};
/**
 * 彈窗內容 key
 */
declare const DIALOG_KEYS: {
    readonly quitTitle: "dialog.quitTitle";
    readonly quitMessage: "dialog.quitMessage";
    readonly maxBetMessage: "dialog.maxBetMessage";
    readonly minBetMessage: "dialog.minBetMessage";
};
/**
 * 倍率上限通知 key
 */
declare const MAX_MULTI_CAP_KEYS: {
    /** 对话框标题 */
    readonly title: "maxMultiCap.title";
    /** 对话框正文，含 {amount} 占位符 */
    readonly message: "maxMultiCap.message";
};
/**
 * 强制退出 key（HTTP 403 + 业务 code 触发，玩家无操作选择）
 */
declare const FORCE_EXIT_KEYS: {
    /** 退出按钮 */
    readonly button: "forceExit.button";
    /** 退出原因讯息 */
    readonly message: "forceExit.message";
};
/**
 * 余额不足 key（业务 code 4001 触发，单按钮提示充值）
 */
declare const INSUFFICIENT_BALANCE_KEYS: {
    /** 对话框标题 */
    readonly title: "insufficientBalance.title";
    /** 对话框正文 */
    readonly message: "insufficientBalance.message";
};
/**
 * ExternalModules 共用 i18n Key 常量
 *
 * 包含所有遊戲共用的翻譯 key
 * 使用 as const 確保類型為字面量（不可變）
 */
export declare const COMMON_I18N_KEYS: {
    readonly common: {
        /** 確認按鈕 */
        readonly confirm: "common.confirm";
        /** 取消按鈕 */
        readonly cancel: "common.cancel";
        /** 離開遊戲按鈕 */
        readonly quitGame: "common.quitGame";
    };
    readonly loading: {
        /** 開始遊戲按鈕 */
        readonly getStarted: "loading.getStarted";
        /** 載入資源中 */
        readonly loadingResources: "loading.loadingResources";
    };
    readonly controlPanel: {
        /** 極速旋轉已開啟 */
        readonly turboEnabled: "controlPanel.turboEnabled";
        /** 極速旋轉已關閉 */
        readonly turboDisabled: "controlPanel.turboDisabled";
    };
    readonly autoSpin: {
        /** 面板標題 */
        readonly title: "autoSpin.title";
        /** 自動旋轉次數 */
        readonly autoSpinCount: "autoSpin.autoSpinCount";
        /** 開始自動旋轉按鈕 */
        readonly startAutoSpin: "autoSpin.startAutoSpin";
    };
    readonly betPanel: {
        /** 面板標題 */
        readonly title: "betPanel.title";
        /** 單注金額 */
        readonly betSize: "betPanel.betSize";
        /** 投注倍數 */
        readonly betLevel: "betPanel.betLevel";
        /** 基礎投注 */
        readonly baseBet: "betPanel.baseBet";
        /** 投注總額 */
        readonly betAmount: "betPanel.betAmount";
        /** 投注線 */
        readonly betLine: "betPanel.betLine";
        /** 最大投注 */
        readonly maxBet: "betPanel.maxBet";
    };
    readonly menu: {
        /** 退出 */
        readonly quit: "menu.quit";
        /** 聲音 */
        readonly sound: "menu.sound";
        /** 賠付表 */
        readonly paytable: "menu.paytable";
        /** 規則 */
        readonly rules: "menu.rules";
        /** 歷史 */
        readonly history: "menu.history";
        /** 關閉 */
        readonly close: "menu.close";
    };
    readonly dialog: {
        readonly quitTitle: "dialog.quitTitle";
        readonly quitMessage: "dialog.quitMessage";
        readonly maxBetMessage: "dialog.maxBetMessage";
        readonly minBetMessage: "dialog.minBetMessage";
    };
    readonly maxMultiCap: {
        /** 对话框标题 */
        readonly title: "maxMultiCap.title";
        /** 对话框正文，含 {amount} 占位符 */
        readonly message: "maxMultiCap.message";
    };
    readonly forceExit: {
        /** 退出按钮 */
        readonly button: "forceExit.button";
        /** 退出原因讯息 */
        readonly message: "forceExit.message";
    };
    readonly insufficientBalance: {
        /** 对话框标题 */
        readonly title: "insufficientBalance.title";
        /** 对话框正文 */
        readonly message: "insufficientBalance.message";
    };
};
/**
 * 類型輔助：取得所有共用 key 的聯合類型
 */
export type CommonI18nKeyType = (typeof COMMON_KEYS)[keyof typeof COMMON_KEYS] | (typeof LOADING_KEYS)[keyof typeof LOADING_KEYS] | (typeof CONTROL_PANEL_KEYS)[keyof typeof CONTROL_PANEL_KEYS] | (typeof AUTO_SPIN_KEYS)[keyof typeof AUTO_SPIN_KEYS] | (typeof BET_PANEL_KEYS)[keyof typeof BET_PANEL_KEYS] | (typeof MENU_KEYS)[keyof typeof MENU_KEYS] | (typeof DIALOG_KEYS)[keyof typeof DIALOG_KEYS] | (typeof MAX_MULTI_CAP_KEYS)[keyof typeof MAX_MULTI_CAP_KEYS] | (typeof FORCE_EXIT_KEYS)[keyof typeof FORCE_EXIT_KEYS] | (typeof INSUFFICIENT_BALANCE_KEYS)[keyof typeof INSUFFICIENT_BALANCE_KEYS];
export {};
//# sourceMappingURL=CommonI18nKeys.d.ts.map