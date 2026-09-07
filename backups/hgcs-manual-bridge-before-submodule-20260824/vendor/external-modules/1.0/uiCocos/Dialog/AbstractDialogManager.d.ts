import { Node, Prefab } from "cc";
import { IDialogManager, DialogOptions, IConfirmAsyncOptions } from "./IDialogManager";
import { IDialogConfig } from "./IDialogConfig";
import { ILogger } from "../../core/Logger/ILogger";
import { DialogViewLogic } from "./DialogViewLogic";
import { IObjectPoolManager } from "../../core/ObjectPool/IObjectPoolManager";
/**
 * 內部標準化後的 Dialog 配置型別
 *
 * 與 IDialogConfig 的差異：
 * - canvas: 標準化為 Node | null（允許 null，不像 Required<IDialogConfig> 強制 Node）
 * - buttonSpacing: 保留 undefined 語意（undefined = 自動伸縮；有值 = 強制固定）
 */
interface NormalizedDialogConfig {
    dialogPrefab: Prefab;
    canvas: Node | null;
    poolCapacity: number;
    labelMaxWidth: number;
    buttonSpacing: number | undefined;
}
/**
 * AbstractDialogManager
 *
 * Manager 層：只負責接收指令和管理資源
 * - 簡易 Pool（避免頻繁創建銷毀）
 * - 調用 DialogViewLogic.show()，讓 Logic 處理所有業務邏輯
 * - 處理雙重 Dialog 顯示情況（新 Dialog 出現時，先關閉舊的並執行其回調）
 *
 * Logic 層（DialogViewLogic）負責：
 * - 位置設置、Canvas 添加、按鈕設置等所有業務邏輯
 *
 * 子類只需實現：
 * - createDialogLogic(): 如何創建 DialogViewLogic 實例
 */
export declare abstract class AbstractDialogManager implements IDialogManager {
    protected logger: ILogger;
    protected poolManager: IObjectPoolManager;
    protected config: NormalizedDialogConfig;
    protected canvas: Node | null;
    protected currentLogic: DialogViewLogic | null;
    protected currentOptions: DialogOptions | null;
    private readonly POOL_TYPE;
    /**
     * 標記是否正在執行正常的關閉流程（確認或取消按鈕點擊）
     * 用於防止雙重 Dialog 誤執行 onCancel
     */
    protected isInNormalCloseFlow: boolean;
    constructor(logger: ILogger, config: IDialogConfig);
    show(options: DialogOptions): void;
    close(): void;
    confirmAsync(opts: IConfirmAsyncOptions): Promise<boolean>;
    /**
     * 安全地獲取 Canvas
     */
    protected getCanvasSafely(): Node | null;
    /**
     * 安全地從 Pool 獲取 Logic
     * 注意：池應該在子類構造函數中預先註冊
     */
    protected getLogicFromPoolSafely(): DialogViewLogic | null;
    /**
     * 放回 Pool
     */
    protected returnLogicToPool(logic: DialogViewLogic): void;
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
     * 創建 DialogViewLogic 實例（由子類實現）
     */
    protected abstract createDialogLogic(): DialogViewLogic;
    private validatePositiveNumber;
    /**
     * 驗證 labelMaxWidth
     * - undefined / null / 0 / 負值：回傳 0（代表不覆寫，維持原本邏輯）
     * - > 0：回傳該值
     * - 非數字：回傳 0 並警告
     */
    private validateLabelMaxWidth;
    /**
     * 驗證 buttonSpacing
     * - undefined / null：回傳 undefined（代表不覆寫，維持自動伸縮）
     * - 有限數字（含 0 與負值）：回傳該值（負值會讓按鈕重疊，使用者自負風險）
     * - 非有限數字（NaN / Infinity / 非數字）：回傳 undefined 並警告
     */
    private validateButtonSpacing;
}
export {};
//# sourceMappingURL=AbstractDialogManager.d.ts.map