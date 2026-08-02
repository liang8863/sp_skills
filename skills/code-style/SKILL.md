---
name: code-style
description: 'TypeScript 代碼風格、錯誤處理、事件使用、注入模式、Cocos 組件引用的最佳實踐。 code review、寫新程式碼、重構時自動參考。'
---


# 代碼風格與最佳實踐

> 所有回覆必須使用繁體中文。

---

## TypeScript 編譯目標

Cocos Creator 3.8 的 tsconfig 目標為 **ES2015**（lib 不含 ES2016+），以下 API **不可使用**：

| 禁用 API | ES 版本 | 替代方案 |
|----------|---------|---------|
| `Array.prototype.includes` | ES2016 | `arr.indexOf(x) !== -1` |
| `Object.entries` / `Object.values` | ES2017 | `Object.keys(obj).map(...)` |
| `String.prototype.padStart/padEnd` | ES2017 | 手動補位 |
| `Object.fromEntries` | ES2019 | 手動構建物件 |
| `Array.prototype.flat/flatMap` | ES2019 | `reduce + concat` |

> **Code Review 時不要建議使用以上 API**，會導致編譯錯誤。

---

## TypeScript 代碼風格

### ✅ 推薦寫法

```typescript
class MyService {
  private readonly logger: ILogger;

  constructor(@inject(IDENTIFIERS.LOGGER) logger: ILogger) {
    this.logger = logger;
  }

  async fetchData(url: string): Promise<Data> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      this.logger.error("Fetch failed", error);
      throw error;
    }
  }
}
```

### ❌ 避免寫法

```typescript
class MyService {
  constructor(private logger: ILogger) {}  // 省略寫法
  async fetchData(url: string) {
    return fetch(url).then((r) => r.json());  // 缺少錯誤處理
  }
}
```

### 重點

- 顯式宣告 `private readonly`
- async/await + try/catch 完整錯誤處理
- 明確的返回類型標註（`Promise<Data>`）

---

## 注入模式

### 遊戲代碼中：透過 ServiceBridge 訪問

```typescript
// ✅ 推薦
import { ServiceBridge } from './bridge';
const logger = ServiceBridge.getLogger();
ServiceBridge.toast.success('初始化成功');
```

### ExternalModules 內部：構造函數注入

```typescript
// ✅ 推薦
class GameController {
  constructor(
    @inject(IDENTIFIERS.LOGGER) private logger: ILogger,
    @inject(IDENTIFIERS.EVENT_SYSTEM) private events: IEventSystem
  ) {}
}
```

### 禁止：直接訪問 window 全域變數

```typescript
// ❌ 避免
const logger = window.ExternalModules.getService(...);
```

---

## 不使用 InversifyJS 裝飾器（遊戲代碼中）

```typescript
// ✅ 正確：普通類
export class MyService implements IService {
  constructor(logger: ILogger) { ... }
}

// ❌ 錯誤：裝飾器會導致重複打包 InversifyJS
@injectable()
export class MyService { ... }
```

此規則僅限遊戲代碼。ExternalModules 內部可以使用裝飾器。

---

## 錯誤處理

### 所有網路請求和異步操作必須 try/catch

```typescript
// ✅ 推薦
try {
  const result = await this.networkService.post("/api/spin", data);
} catch (error) {
  this.logger.error("Spin failed", error);
  this.toastManager.error("操作失敗，請重試");
  // 適當時機恢復狀態
}

// ❌ 避免
await this.networkService.post("/api/spin", data);  // 無錯誤處理
```

---

## 事件驅動

### ✅ 推薦：事件解耦

```typescript
// 發射
eventSystem.emit("game:spin", { speed: 100 });

// 監聽
eventSystem.on("game:spin", (result) => {
  this.updateUI(result);
});
```

### ❌ 避免：直接耦合

```typescript
this.gameView.updateUI(result);  // 緊耦合
```

---

## Cocos 組件引用

### 核心原則：非必要禁止使用 `getComponent`

能透過 `@property` 直接綁定的組件，一律用 `@property` 宣告正確的組件類型，**禁止在運行時用 `getComponent` 取得**。

### ❌ 避免

```typescript
// ❌ 綁 Node 再 getComponent — 多一次運行時查找，類型不安全
@property(Node)
private vfxNode: Node = null!;

onLoad() {
  const opacity = this.vfxNode.getComponent(UIOpacity);  // 禁止
  const label = this.vfxNode.getComponent(Label);         // 禁止
}

// ❌ 字串查找更危險
const view = node.getComponent("CustomView");  // 字串易拼錯
```

### ✅ 推薦：直接綁定目標組件類型

```typescript
// ✅ 直接綁定 UIOpacity，編輯器拖組件即可
@property(UIOpacity)
private vfxOpacity: UIOpacity = null!;

// ✅ 直接綁定 Label
@property(Label)
private titleLabel: Label = null!;

// ✅ 直接綁定自定義組件
@property(CustomLoadingView)
private loadingView: CustomLoadingView = null!;
```

### 允許使用 `getComponent` 的例外情況

- 動態生成的節點（`instantiate` / `addChild`）上的組件
- 需要在運行時根據條件取得不同組件的場景
- 遍歷子節點等無法預先綁定的情況

**優點：** 類型安全、自動補全、重構友好、避免拼寫錯誤、性能更好（不需運行時查找）

---

## 語言規則

- 代碼註解、README、說明文件使用**簡體中文**（後續維護者使用簡體）
- 簡體中文的註解不是問題，Code Review 時不要標記

---

## 重構規則

### 不留過渡性註解

重構後的程式碼應該像「從頭寫的」一樣乾淨。

```typescript
// ❌ 禁止
// 原本是 getPlayerInfo，改名為 getPlayerData
export function getPlayerData() { ... }

// 原本用 string，改成 enum
// export type Status = string;  // removed
export enum Status { ... }

// xxx 已棄用，請使用 yyy
// @deprecated use newMethod instead
export function oldMethod() { return newMethod(); }

// ❌ 禁止保留舊名稱的 re-export
export { newName as oldName };  // 向後兼容
```

```typescript
// ✅ 正確：直接寫新的，不解釋來歷
export function getPlayerData() { ... }
export enum Status { ... }
```

**原則：**
- 不寫 `// 原本是 xxx，改成 yyy` 之類的變更說明
- 不寫 `// removed`、`// deleted`、`// deprecated` 註解
- 不保留舊變數名的 re-export 或別名
- 確定不再使用的程式碼直接刪除，不要註解掉
- 只保留新功能本身的說明

---

### 實際範例

```typescript
// EarlyLoadingHelper.ts
export class EarlyLoadingHelper {
  static update(view: ILoadingView | null, progress: number): void {
    const progressBar = view.getProgressBar();   // 類型安全
    const progressText = view.getProgressText(); // IDE 自動補全
  }
}

// Bootstrap.ts
@ccclass("Bootstrap")
export class Bootstrap extends Component {
  @property(CustomLoadingView)
  earlyLoadingView: CustomLoadingView = null!;  // 編輯器拖拽

  onLoad() {
    EarlyLoadingHelper.update(this.earlyLoadingView, 50);  // 類型檢查
  }
}
```
