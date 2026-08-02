---
name: custom-ui-component
description: '自定義 UI 組件的開發模式。當建立新的 Loading、Toast、Dialog、 GamePanel 等自定義組件，或修改現有自定義組件時使用。'
---


# 自定義 UI 組件開發

> 所有回覆必須使用繁體中文。

---

## 設計模式：IXxxView 接口模式

三步驟：定義接口 → 實現組件 → Bootstrap 綁定

```typescript
// 1. 接口定義（bridge/types/ 中）
interface ILoadingView {
  getNode(): Node;
  getProgressBar(): ProgressBar | null;
  getProgressText(): Label | null;
}

// 2. 組件實現（custom/ 目錄中）
@ccclass("CustomLoadingView")
export class CustomLoadingView extends BaseComponentView implements ILoadingView {
  @property(ProgressBar)
  progressBar: ProgressBar = null!;

  getProgressBar(): ProgressBar | null {
    return this.progressBar;
  }

  getProgressText(): Label | null {
    return this.progressText;
  }
}

// 3. 在 Bootstrap 中綁定到 Container
ServiceBridge.addCustomConfigure(() => {
  const { container, SERVICE_IDENTIFIERS } = window.ExternalModules;
  const logger = container.get(SERVICE_IDENTIFIERS.LOGGER);

  const loadingManager = new LoadingManager(logger, {
    loadingView: loadingViewInstance,
  });
  container.bind(SERVICE_IDENTIFIERS.LOADING_MANAGER)
    .toConstantValue(loadingManager);
});
```

---

## 組件清單

| 組件 | 說明 |
|------|------|
| `CustomLoadingView` | 載入畫面 |
| `CustomToastView` | Toast 提示 |
| `CustomDialogView` | 對話框 |
| `CustomGamePanelView` | 遊戲面板容器 |
| `CustomInfoBarView` | 資訊欄（餘額、贏分） |
| `CustomControlPanelView` | 控制面板（Spin 按鈕） |
| `CustomBetPanelView` | 下注面板 |
| `CustomAutoSpinPanelView` | Auto-spin 設定 |
| `CustomMenuPanelView` | 選單面板 |
| `CustomMarqueeBarView` | 跑馬燈 |
| `CustomReelsContainerView` | 捲軸容器 |
| `CustomSlotReelSymbolView` | 單一圖標 View（超薄殼） |
| `CustomSlotReelView` | 單一轉軸 View（超薄殼） |
| `CustomSlotReelMgrView` | 轉輪管理器 View（編輯器可配置參數） |
| `CustomAudioButtonView` | 音頻按鈕 |
| `CustomDiscretePicker` | 離散選擇器 |

---

## Prefab 關係與資料歸屬規則

1. View 層 `Component` 腳本之間的依賴關係，優先交給 prefab 結構和 `@property` 綁定管理；不要用 runtime `find` / `getComponent` 臨時拼關係，除非是明確 fallback。
2. 盡量不要在 View 邏輯中動態載入 prefab。需要用到的子 prefab 應預先掛在引用方 prefab 下，平時可保持 inactive，需要時直接由 ViewComponent 使用。
3. 子 prefab、holder、mask、特效節點、資料節點等需要被 View 使用的對象，要在引用方 ViewComponent 上預先關聯好，讓依賴在 prefab 上可見、可檢查。
4. prefab 使用的配置資料，盡量存放在 prefab 或其子 prefab 上；不要放到 scene 裡，除非該資料確實只屬於該 scene。多分枝開發時，scene 更容易產生衝突。

---

## Logic-View 延遲載入模式

部分 View 組件會直接使用 ext-module 的 Logic class（如 `SequenceSpriteLogic`、`AudioButtonLogic`）。
ExternalModules 是**非同步載入**的，`window.ExternalModules` 在任何 Cocos 生命週期（`onLoad`、`start`、`onEnable`）都**不保證存在**。

### 規則

1. **禁止在生命週期中直接 new Logic** — 必須用延遲初始化
2. **禁止 `any` 型別** — 透過 `import type` 匯入 Logic class 型別
3. **`_ensureLogic()` 模式** — 使用時才嘗試初始化，沒載入就跳過

### 範例

```typescript
import type { ISequenceSpriteView, SequenceSpriteLogic } from "../../bridge/types/uiCocos/Common";

@ccclass("CustomSequenceSpriteView")
export class CustomSequenceSpriteView extends BaseComponentView implements ISequenceSpriteView {
    private logic: SequenceSpriteLogic | null = null;

    /** 延遲初始化：ExternalModules 載入後才建立 Logic */
    private _ensureLogic(): boolean {
        if (this.logic) return true;
        const ext = (window as any).ExternalModules;
        if (!ext?.SequenceSpriteLogic) return false;  // 沒載入就跳過
        this.logic = new ext.SequenceSpriteLogic(this) as SequenceSpriteLogic;
        this.logic.initialize();
        return true;
    }

    protected onEnable(): void {
        if (this.playOnShow && this._ensureLogic() && this.logic!.totalFrames > 0) {
            this.logic!.play();
        }
    }

    play(): void {
        if (this._ensureLogic()) this.logic!.play();
    }

    protected update(dt: number): void {
        super.update(dt);
        this.logic?.tick(dt);
    }

    protected onDestroy(): void {
        this.logic = null;
        super.onDestroy();
    }
}
```

### bridge/types 匯出 Logic 型別

Logic class 也需要從 bridge/types 匯出（`export type`，只有編譯時檢查）：

```typescript
// bridge/types/uiCocos/Common/index.ts
export type {
    ISequenceSpriteView,
    SequenceSpriteLogic,  // class 也用 export type
} from "../../../../../../../../slot-game-ext-module/1.0/dist/uiCocos/Common";
```

---

## 重要規則

1. **必須完整實現接口所有方法** — 否則運行時報錯
2. **不使用 @injectable() 裝飾器** — 避免重複打包 InversifyJS
3. **自定義服務放在 `custom/` 目錄**
4. **用 `toConstantValue()` 綁定** — 手動建立實例再綁定
5. **用 `rebind()` 替換已有服務，`bind()` 新增服務**

---

## 替換多個服務範例

```typescript
ServiceBridge.addCustomConfigure(() => {
  const { container, SERVICE_IDENTIFIERS } = window.ExternalModules;
  const logger = container.get(SERVICE_IDENTIFIERS.LOGGER);
  const events = container.get(SERVICE_IDENTIFIERS.EVENT_SYSTEM);

  // 替換 ToastManager
  const customToast = new MyToastManager(logger);
  container.rebind(SERVICE_IDENTIFIERS.TOAST_MANAGER)
    .toConstantValue(customToast);

  // 替換 DialogManager
  const customDialog = new MyDialogManager(logger, events);
  container.rebind(SERVICE_IDENTIFIERS.DIALOG_MANAGER)
    .toConstantValue(customDialog);
});
```

---

## 目錄結構

```
custom/
├── Loading/
│   └── CustomLoadingView.ts
├── Toast/
│   └── CustomToastView.ts
├── Dialog/
│   └── CustomDialogView.ts
├── GamePanel/
│   ├── CustomGamePanelView.ts
│   ├── CustomInfoBarView.ts
│   ├── CustomControlPanelView.ts
│   ├── CustomBetPanelView.ts
│   ├── CustomAutoSpinPanelView.ts
│   ├── CustomMenuPanelView.ts
│   ├── CustomMarqueeBarView.ts
│   ├── CustomReelsContainerView.ts
│   ├── CustomSlotReelSymbolView.ts
│   ├── CustomSlotReelView.ts
│   └── CustomSlotReelMgrView.ts
└── Common/
    ├── CustomAudioButtonView.ts
    └── CustomDiscretePicker.ts
```
