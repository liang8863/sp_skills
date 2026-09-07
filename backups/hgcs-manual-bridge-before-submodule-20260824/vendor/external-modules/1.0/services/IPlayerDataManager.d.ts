/**
 * PlayerDataManager 接口定義
 *
 * 功能：管理玩家核心數據（餘額、下注金額、Token 等）
 * 持久化：純記憶體存儲（不保存到 LocalStorage）
 * 事件：通過 EventSystem 發送全局事件（單一事件系統）
 */
/**
 * 玩家數據結構
 */
export interface IPlayerData {
    /** 玩家唯一標識符 */
    playerId: string;
    /** 玩家錢包餘額（籌碼） */
    balance: number;
    /** 當前下注金額 */
    betAmount: number;
    /** 認證用的 Token */
    playerToken: string;
    /** 運營商 ID */
    operatorId: string;
    /** 貨幣類型 */
    currency: string;
}
/**
 * 餘額變化事件數據
 */
export interface IBalanceChangeData {
    /** 舊餘額 */
    oldBalance: number;
    /** 新餘額 */
    newBalance: number;
    /** 變化量（正數為增加，負數為減少） */
    delta: number;
}
/**
 * 下注金額變化事件數據
 */
export interface IBetAmountChangeData {
    /** 舊下注金額 */
    oldBetAmount: number;
    /** 新下注金額 */
    newBetAmount: number;
}
/**
 * PlayerDataManager 服務接口
 *
 * 設計原則：
 * - 單一數據源（Single Source of Truth）
 * - 事件驅動（通過 EventSystem 發送全局事件）
 * - 純記憶體存儲（不持久化）
 * - 基本數據驗證（類型 + 範圍檢查）
 */
export interface IPlayerDataManager {
    /**
     * 獲取完整的玩家數據（返回副本）
     */
    getPlayerData(): IPlayerData;
    /**
     * 獲取玩家 ID
     */
    getPlayerId(): string;
    /**
     * 獲取玩家餘額
     */
    getBalance(): number;
    /**
     * 獲取當前下注金額
     */
    getBetAmount(): number;
    /**
     * 獲取玩家 Token
     */
    getPlayerToken(): string;
    /**
     * 獲取運營商 ID
     */
    getOperatorId(): string;
    /**
     * 獲取貨幣類型
     */
    getCurrency(): string;
    /**
     * 檢查餘額是否足夠
     * @param amount - 需要檢查的金額
     * @returns true 表示餘額足夠
     */
    hasEnoughBalance(amount: number): boolean;
    /**
     * 設置完整的玩家數據
     * @param data - 玩家數據
     * @fires PLAYER_DATA_EVENTS.DATA_LOADED
     */
    setPlayerData(data: IPlayerData): void;
    /**
     * 設置玩家餘額（絕對值）
     * @param balance - 新餘額（必須 >= 0）
     * @fires PLAYER_DATA_EVENTS.BALANCE_CHANGED
     */
    setBalance(balance: number): void;
    /**
     * 增加/減少餘額（相對值）
     * @param amount - 變化量（正數為增加，負數為減少）
     * @fires PLAYER_DATA_EVENTS.BALANCE_CHANGED
     */
    addBalance(amount: number): void;
    /**
     * 設置下注金額
     * @param betAmount - 新的下注金額（必須 >= 0）
     * @fires PLAYER_DATA_EVENTS.BET_AMOUNT_CHANGED
     */
    setBetAmount(betAmount: number): void;
    /**
     * 設置玩家 Token
     * @param token - 新的 Token
     * @fires PLAYER_DATA_EVENTS.TOKEN_UPDATED
     */
    setPlayerToken(token: string): void;
    /**
     * 設置運營商 ID
     * @param operatorId - 運營商 ID
     */
    setOperatorId(operatorId: string): void;
    /**
     * 設置貨幣類型
     * @param currency - 貨幣類型（例如 CNY, USD）
     */
    setCurrency(currency: string): void;
    /**
     * 清除玩家數據（重置為默認值）
     * @fires PLAYER_DATA_EVENTS.DATA_CLEARED
     */
    clear(): void;
    /**
     * 重置玩家數據（與 clear 相同）
     * @fires PLAYER_DATA_EVENTS.DATA_CLEARED
     */
    reset(): void;
}
//# sourceMappingURL=IPlayerDataManager.d.ts.map