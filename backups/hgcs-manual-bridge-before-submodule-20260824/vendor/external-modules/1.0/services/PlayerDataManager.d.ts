import { IPlayerDataManager, IPlayerData } from "./IPlayerDataManager";
import { ILogger } from "../core/Logger/ILogger";
import { IEventSystem } from "../core/EventSystem/IEventSystem";
/**
 * PlayerDataManager 實現
 *
 * 功能：
 * - 管理玩家核心數據（餘額、下注金額、Token）
 * - 純記憶體存儲（不持久化到 LocalStorage）
 * - 通過 EventSystem 發送全局事件（單一事件系統）
 * - 基本數據驗證（類型 + 範圍檢查）
 *
 * 設計特點：
 * - ✅ 單一事件系統（只使用 EventSystem）
 * - ✅ 單一數據源（Server 為權威數據源）
 * - ✅ 返回數據副本（避免外部修改內部狀態）
 * - ✅ 完整的錯誤處理和驗證
 */
export declare class PlayerDataManager implements IPlayerDataManager {
    private logger;
    private eventSystem;
    private playerData;
    private readonly DEFAULT_DATA;
    constructor(logger: ILogger, eventSystem: IEventSystem);
    getPlayerData(): IPlayerData;
    getPlayerId(): string;
    getBalance(): number;
    getBetAmount(): number;
    getPlayerToken(): string;
    getOperatorId(): string;
    getCurrency(): string;
    hasEnoughBalance(amount: number): boolean;
    setPlayerData(data: IPlayerData): void;
    setBalance(balance: number): void;
    addBalance(amount: number): void;
    setBetAmount(betAmount: number): void;
    setPlayerToken(token: string): void;
    setOperatorId(operatorId: string): void;
    setCurrency(currency: string): void;
    clear(): void;
    reset(): void;
    /**
     * 驗證玩家數據
     */
    private validatePlayerData;
    /**
     * 發送餘額變化事件
     */
    private emitBalanceChanged;
    /**
     * 發送下注金額變化事件
     */
    private emitBetAmountChanged;
}
//# sourceMappingURL=PlayerDataManager.d.ts.map