/**
 * UI/UX Layer 类型定义
 *
 * 包含所有 UI 组件的类型
 */

// ==================== Toast ====================
export type {
  IToastManager,
  IToastOptions,
  IToastView,
  IToastConfig,
  AbstractToastManager,
} from "./Toast";

// ==================== Dialog ====================
export type {
  IDialogManager,
  DialogOptions,
  IDialogView,
  IDialogConfig,
  AbstractDialogManager,
} from "./Dialog";

// ==================== Loading ====================
export type {
  ILoadingManager,
  ILoadingOptions,
  ILoadingView,
  ILoadingConfig,
} from "./Loading";

// ==================== GamePanel ====================
export type {
  // GamePanel Container
  IGamePanelView,
  GamePanelLogic,

  // GamePanel Components
  IMarqueeBarView,
  AbstractMarqueeBarLogic,
  IInfoBarView,
  AbstractInfoBarLogic,
  IControlPanelView,
  AbstractControlPanelLogic,
  IMenuPanelView,
  AbstractMenuPanelLogic,
  IBetPanelView,
  AbstractBetPanelLogic,
  BetPanelLogic,
  BetPanelConfig,
  BetInfo,
  IAutoSpinPanelView,
  IToggleLabelColors,
  IStartButtonColors,
  AbstractAutoSpinPanelLogic,
  IReelsContainerView,
  AbstractReelsContainerLogic,
} from "./GamePanel";

// ==================== Common UI Components ====================
export type { IDiscretePickerView, DiscretePickerConfig } from "./Common";

// ==================== Base Component ====================
export { BaseComponentView } from "./BaseComponentView";
