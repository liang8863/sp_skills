/**
 * 遊戲動作類型常量定義
 *
 * 統一管理所有遊戲動作的字串常量，避免 magic string
 * 命名規則：UPPER_SNAKE_CASE
 */
/**
 * 遊戲動作類型常量
 *
 * 用於 GameActionService 的動作標識
 */
export declare const GAME_ACTION_TYPES: {
    /**
     * 旋轉（Spin）
     *
     * 觸發一次遊戲旋轉
     */
    readonly SPIN: "spin";
    /**
     * 停止自動旋轉（Stop Auto Spin）
     *
     * 停止自動旋轉模式
     */
    readonly STOP_AUTO_SPIN: "stopAutoSpin";
    /**
     * 立即停止旋轉（Immediate Stop）
     *
     * 立即停止旋轉，跳過動畫
     */
    readonly IMMEDIATE_STOP: "immediateStop";
    /**
     * 增加押注（Add Bet）
     *
     * 增加當前押注金額
     */
    readonly ADD_BET: "addBet";
    /**
     * 減少押注（Subtract Bet）
     *
     * 減少當前押注金額
     */
    readonly SUBTRACT_BET: "subtractBet";
    /**
     * 最大押注（Max Bet）
     *
     * 設定為最大押注金額
     */
    readonly MAX_BET: "maxBet";
    /**
     * 設定押注（Set Bet）
     *
     * 設定目前押注金額
     */
    readonly SET_BET: "setBet";
    /**
     * 開啟餘額面板（Open Balance）
     *
     * 顯示玩家餘額詳情
     */
    readonly OPEN_BALANCE: "openBalance";
    /**
     * 關閉餘額面板（Close Balance）
     *
     * 隱藏玩家餘額詳情
     */
    readonly CLOSE_BALANCE: "closeBalance";
    /**
     * 開啟投注設置面板（Open Bet Settings）
     *
     * 顯示押注金額設定介面
     */
    readonly OPEN_BET_SETTINGS: "openBetSettings";
    /**
     * 關閉投注設置面板（Close Bet Settings）
     *
     * 隱藏押注金額設定介面
     */
    readonly CLOSE_BET_SETTINGS: "closeBetSettings";
    /**
     * 開啟歷史紀錄（Open History）
     *
     * 顯示遊戲歷史紀錄
     */
    readonly OPEN_HISTORY: "openHistory";
    /**
     * 關閉歷史紀錄（Close History）
     *
     * 隱藏遊戲歷史紀錄
     */
    readonly CLOSE_HISTORY: "closeHistory";
    /**
     * 開啟選單（Open Menu）
     *
     * 顯示遊戲主選單
     */
    readonly OPEN_MENU: "openMenu";
    /**
     * 關閉選單（Close Menu）
     *
     * 隱藏遊戲主選單
     */
    readonly CLOSE_MENU: "closeMenu";
    /**
     * 開啟賠付表（Open Paytable）
     *
     * 顯示遊戲賠付表
     */
    readonly OPEN_PAYTABLE: "openPaytable";
    /**
     * 關閉賠付表（Close Paytable）
     *
     * 隱藏遊戲賠付表
     */
    readonly CLOSE_PAYTABLE: "closePaytable";
    /**
     * 開啟規則說明（Open Rules）
     *
     * 顯示遊戲規則說明
     */
    readonly OPEN_RULES: "openRules";
    /**
     * 關閉規則說明（Close Rules）
     *
     * 隱藏遊戲規則說明
     */
    readonly CLOSE_RULES: "closeRules";
    /**
     * 開啟自動旋轉設定頁（Open Auto Spin Settings）
     *
     * 顯示自動旋轉次數設定介面
     */
    readonly OPEN_AUTO_SPIN_SETTINGS: "openAutoSpinSettings";
    /**
     * 關閉自動旋轉設定頁（Close Auto Spin Settings）
     *
     * 隱藏自動旋轉次數設定介面
     */
    readonly CLOSE_AUTO_SPIN_SETTINGS: "closeAutoSpinSettings";
    /**
     * 設定自動旋轉次數（Set Auto Spin Count）
     *
     * 設定自動旋轉的次數
     */
    readonly SET_AUTO_SPIN_COUNT: "setAutoSpinCount";
    /**
     * 自動旋轉（Auto Spin）
     *
     * 開始自動旋轉模式
     */
    readonly AUTO_SPIN: "autoSpin";
    /**
     * 開啟急速旋轉（Enable Turbo Spin）
     *
     * 啟用快速旋轉模式
     */
    readonly ENABLE_TURBO_SPIN: "enableTurboSpin";
    /**
     * 關閉急速旋轉（Disable Turbo Spin）
     *
     * 停用快速旋轉模式
     */
    readonly DISABLE_TURBO_SPIN: "disableTurboSpin";
    /**
     * 開啟音效（Enable Sound）
     *
     * 啟用遊戲音效
     */
    readonly ENABLE_SOUND: "enableSound";
    /**
     * 關閉音效（Disable Sound）
     *
     * 停用遊戲音效
     */
    readonly DISABLE_SOUND: "disableSound";
    /**
     * 開啟特色功能購買面板（Open Feature Buy）
     *
     * 顯示特色功能購買介面
     */
    readonly OPEN_FEATURE_BUY: "openFeatureBuy";
    /**
     * 關閉特色功能購買面板（Close Feature Buy）
     *
     * 隱藏特色功能購買介面
     */
    readonly CLOSE_FEATURE_BUY: "closeFeatureBuy";
    /**
     * 確認特色功能購買（Confirm Feature Buy）
     *
     * 確認購買特色功能
     */
    readonly CONFIRM_FEATURE_BUY: "confirmFeatureBuy";
    /**
     * 退出遊戲（Exit Game）
     *
     * 離開當前遊戲，返回大廳
     */
    readonly EXIT_GAME: "exitGame";
};
/**
 * 遊戲動作類型（類型定義）
 *
 * 從常量對象中提取所有值的聯合類型
 */
export type GameActionType = (typeof GAME_ACTION_TYPES)[keyof typeof GAME_ACTION_TYPES];
/**
 * 動作執行結果
 */
export interface ActionResult {
    /**
     * 是否成功
     */
    success: boolean;
    /**
     * 失敗原因（success 為 false 時提供）
     */
    reason?: string;
    /**
     * 錯誤對象（發生異常時提供）
     */
    error?: unknown;
    /**
     * 返回數據（可選）
     */
    data?: unknown;
}
/**
 * 動作狀態
 */
export interface ActionState {
    /**
     * 是否被鎖定（防連點鎖定）
     */
    isLocked: boolean;
    /**
     * 是否可以執行
     */
    canExecute: boolean;
    /**
     * 剩餘冷卻時間（毫秒）
     */
    cooldownRemaining: number;
    /**
     * 不能執行的原因（canExecute 為 false 時提供）
     */
    reason?: string;
}
/**
 * 動作配置
 */
export interface ActionConfig {
    /**
     * 動作類型
     */
    type: GameActionType;
    /**
     * 冷卻時間（毫秒）
     *
     * 執行後會鎖定此時間，防止連點
     */
    cooldown: number;
    /**
     * 是否需要檢查遊戲狀態
     */
    checkGameState?: boolean;
    /**
     * 是否需要檢查餘額
     */
    checkBalance?: boolean;
}
/**
 * 動作冷卻配置（默認值）
 *
 * 各動作的默認冷卻時間（毫秒）
 */
export declare const ACTION_COOLDOWNS: Record<GameActionType, number>;
/**
 * 動作阻止原因常量
 *
 * 統一管理所有阻止動作的原因字串
 */
export declare const ACTION_BLOCK_REASONS: {
    /**
     * 全局鎖定中
     */
    readonly GLOBAL_LOCKED: "遊戲繁忙中，請稍後";
    /**
     * 動作冷卻中
     */
    readonly ACTION_COOLDOWN: "操作冷卻中，請稍後";
    /**
     * 遊戲狀態不符
     */
    readonly INVALID_GAME_STATE: "當前遊戲狀態無法執行此操作";
    /**
     * 餘額不足
     */
    readonly INSUFFICIENT_BALANCE: "餘額不足";
    /**
     * 遊戲進行中
     */
    readonly GAME_IN_PROGRESS: "遊戲進行中，無法執行";
    /**
     * 自動旋轉進行中
     */
    readonly AUTO_SPIN_IN_PROGRESS: "自動旋轉進行中";
    /**
     * 未在自動旋轉模式
     */
    readonly NOT_IN_AUTO_SPIN: "未在自動旋轉模式";
    /**
     * 無獎勵可領取
     */
    readonly NO_REWARD_TO_COLLECT: "無獎勵可領取";
    /**
     * 未知錯誤
     */
    readonly UNKNOWN_ERROR: "未知錯誤";
};
/**
 * 動作阻止原因類型
 */
export type ActionBlockReason = (typeof ACTION_BLOCK_REASONS)[keyof typeof ACTION_BLOCK_REASONS];
//# sourceMappingURL=GameActionTypes.d.ts.map