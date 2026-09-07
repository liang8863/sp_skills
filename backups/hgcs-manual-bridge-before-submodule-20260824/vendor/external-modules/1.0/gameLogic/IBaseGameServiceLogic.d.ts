/**
 * BaseGameServiceLogic 公開介面
 *
 * 遊戲端 GameService 透過此介面委託所有通用邏輯。
 */
import type { IBaseSpinResult } from "./IBaseSpinResult";
import type { IBetInfo, ICheckLastSpinResult } from "./GameServiceTypes";
export interface IBaseGameServiceLogic<TResult extends IBaseSpinResult = IBaseSpinResult> {
    /** 設定獲取下注資訊的回調 */
    setGetBetInfoCallback(callback: () => IBetInfo): void;
    /** 設定獲取 Turbo 模式的回調 */
    setGetTurboModeCallback(callback: () => boolean): void;
    /** 檢查上次旋轉（僅檢查，不執行表演） */
    checkLastSpin(): Promise<ICheckLastSpinResult<TResult>>;
    /** 恢復並表演上次旋轉 */
    restoreLastSpin(): Promise<void>;
    /** 正常旋轉 */
    spin(betInfo: IBetInfo): Promise<void>;
    /** 開始自動旋轉 */
    autoSpin(count: number, betInfo: IBetInfo): Promise<void>;
    /** 購買免費遊戲 */
    featureBuy?(betInfo: IBetInfo): Promise<void>;
    /** 停止自動旋轉 */
    stopAutoSpin(): void;
    /** 獲取當前下注資訊（供 hooks 內部調用） */
    getCurrentBetInfo(): IBetInfo;
    /** 是否在免費遊戲模式中 */
    isInFreeGameMode(): boolean;
    /** 設定免費遊戲模式 */
    setFreeGameMode(value: boolean): void;
    /** 完整的 spin 完成流程（供 hooks.onRestoreComplete 調用） */
    handleSpinCompleteFlow(result: TResult): Promise<void>;
    /**
     * 逐画面赢分/余额显示 helper（游戏端在每段连线 win 表演开始时调用）。
     * 发送 UPDATE_WIN(spinWinSum) 并把余额更新为当前 result.balance，
     * 让赢分与余额随表演逐画面爬升。
     * @param result 不传时默认使用当前 spin 结果
     */
    applyScreenWinDisplay(result?: TResult): void;
}
//# sourceMappingURL=IBaseGameServiceLogic.d.ts.map