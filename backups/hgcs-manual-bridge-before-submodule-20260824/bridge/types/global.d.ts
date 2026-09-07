/**
 * 全域类型声明
 *
 * 引用 ExternalModules 的类型定义，使其 declare global 生效
 * 这样 window.ExternalModules 就有完整的类型提示
 */

/// <reference path="../../../../vendor/external-modules/1.0/index.d.ts" />

import type { GamePanelLogic } from "../../../../vendor/external-modules/1.0/uiCocos/GamePanel/GamePanelLogic";

declare global {
  interface Window {
    /** 调试用：Bootstrap 实例 */
    bootstrap?: unknown;
    /** GamePanelLogic 实例（用于全域访问） */
    gamePanelLogic?: GamePanelLogic;
  }
}

export {};
