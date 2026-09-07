import type { Node, ToggleContainer, Color } from "cc";
import type { IInfoBarView } from "./IInfoBarView";
import type { IAudioButtonView } from "../Common/IAudioButtonView";
/**
 * Toggle Label 顏色配置接口
 */
export interface IToggleLabelColors {
    /** 未選中狀態顏色 */
    normal: Color;
    /** Hover 狀態顏色 */
    hover: Color;
    /** 選中狀態顏色 */
    selected: Color;
}
/**
 * StartButton 顏色配置接口
 */
export interface IStartButtonColors {
    /** 正常狀態顏色 */
    normal: Color;
    /** 禁用狀態顏色 */
    disabled: Color;
}
/**
 * AutoSpinPanel View 接口
 *
 * 職責：提供自動旋轉設定面板的組件訪問器
 */
export interface IAutoSpinPanelView {
    /**
     * 獲取 AutoSpinPanel 根節點
     */
    getNode(): Node;
    /**
     * 獲取自動次數 Toggle 容器（用於動態生成 Toggle，掛載 ToggleContainer 組件）
     */
    getAutoSpinCountContainer(): Node | null;
    /**
     * 獲取 ToggleContainer 組件（用於管理單選）
     */
    getToggleContainer(): ToggleContainer | null;
    /**
     * 獲取次數 Toggle 模板節點（用於複製生成，掛載 Toggle 組件）
     */
    getCountToggleTemplate(): Node | null;
    /**
     * 獲取 InfoBar 組件（顯示餘額、下注、贏分）
     */
    getInfoBar(): IInfoBarView | null;
    /**
     * 獲取開始按鈕
     */
    getStartButton(): IAudioButtonView | null;
    /**
     * 獲取取消/關閉按鈕
     */
    getCancelButton(): IAudioButtonView | null;
    /**
     * 獲取遮罩按鈕（點擊背景關閉面板）
     */
    getMaskButton(): IAudioButtonView | null;
    /**
     * 獲取內容背景節點（用於動畫滑入滑出）
     */
    getContentBackground(): Node | null;
    /**
     * 獲取內容節點（包含所有面板內容）
     */
    getContent(): Node | null;
    /**
     * 獲取 Toggle Label 顏色配置
     */
    getToggleLabelColors(): IToggleLabelColors;
    /**
     * 獲取 StartButton 顏色配置
     */
    getStartButtonColors(): IStartButtonColors;
}
//# sourceMappingURL=IAutoSpinPanelView.d.ts.map