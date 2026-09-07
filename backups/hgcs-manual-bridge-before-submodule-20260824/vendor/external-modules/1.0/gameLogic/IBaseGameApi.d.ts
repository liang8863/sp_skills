/**
 * 通用遊戲 API 介面
 *
 * 各遊戲的 GameApi 應 implements 此介面。
 */
import type { IBaseSpinResult } from "./IBaseSpinResult";
export interface IBaseSpinRequest {
    gameCode: string;
    betSize: number;
    betLevel: number;
    betWays: number;
    seed?: string;
    p1?: number;
}
export interface IBaseLastSpinRequest {
    gameCode: string;
}
export interface IBaseGameApi<TResult extends IBaseSpinResult = IBaseSpinResult> {
    spin(request: IBaseSpinRequest): Promise<TResult>;
    lastSpin(request: IBaseLastSpinRequest): Promise<TResult | null>;
    featureBuy?(request: IBaseSpinRequest): Promise<TResult>;
}
//# sourceMappingURL=IBaseGameApi.d.ts.map