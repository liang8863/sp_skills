import { Node } from "cc";
import { IToastManager, ToastOptions } from "./IToastManager";
import { IToastConfig } from "./IToastConfig";
import { ILogger } from "../../core/Logger/ILogger";
import { ToastViewLogic } from "./ToastViewLogic";
import { IObjectPoolManager } from "../../core/ObjectPool/IObjectPoolManager";
/**
 * Toast 槽位（顯示位置管理）
 */
interface ToastSlot {
    /** 槽位索引 */
    index: number;
    /** 當前顯示的內容（用於去重） */
    currentMessage: string | null;
    /** 當前 Toast Logic */
    currentLogic: ToastViewLogic | null;
    /** 上次顯示完成時間 */
    lastShowTime: number;
    /** 是否正在使用 */
    isActive: boolean;
}
/**
 * AbstractToastManager
 *
 * Manager 層：只負責接收指令和管理資源
 * - 簡易 Pool（避免頻繁創建銷毀）
 * - 槽位管理（追蹤當前顯示的 Toast）
 * - 調用 ToastViewLogic.show()，讓 Logic 處理所有業務邏輯
 *
 * Logic 層（ToastViewLogic）負責：
 * - 位置設置、Canvas 添加、動畫控制、超時保護等所有業務邏輯
 *
 * 子類只需實現：
 * - createToastLogic(): 如何創建 ToastViewLogic 實例
 */
export declare abstract class AbstractToastManager implements IToastManager {
    protected logger: ILogger;
    protected slots: ToastSlot[];
    protected poolManager: IObjectPoolManager;
    protected config: Required<IToastConfig>;
    protected canvas: Node | null;
    private readonly POOL_TYPE;
    constructor(logger: ILogger, config: IToastConfig);
    show(message: string, options?: ToastOptions): void;
    clear(): void;
    /**
     * 立即隱藏當前顯示的 Toast（替換模式）
     */
    protected hideCurrentToast(): void;
    /**
     * 安全地獲取 Canvas
     */
    protected getCanvasSafely(): Node | null;
    /**
     * 獲取消息唯一鍵（用於去重）
     */
    protected getMessageKey(message: string): string;
    /**
     * 安全地從 Pool 獲取 Logic
     * 注意：池應該在子類構造函數中預先註冊
     */
    protected getLogicFromPoolSafely(): ToastViewLogic | null;
    /**
     * 放回 Pool
     */
    protected returnLogicToPool(logic: ToastViewLogic): void;
    /**
     * 註冊池（由子類在構造函數中調用）
     *
     * 這是「構造函數註冊」方式（動態註冊的一種）：
     * - 在 Manager 創建時自動註冊
     * - 如果 Manager 沒有被創建，池就不會被註冊
     * - 比「使用時註冊」更早，比「Bootstrap 統一註冊」更晚
     */
    protected registerPool(): void;
    /**
     * 創建 ToastViewLogic 實例（由子類實現）
     */
    protected abstract createToastLogic(): ToastViewLogic;
    private validateDuration;
    private validatePositiveNumber;
}
export {};
//# sourceMappingURL=AbstractToastManager.d.ts.map