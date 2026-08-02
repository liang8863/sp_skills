---
name: service-bridge-api
description: 'ServiceBridge 完整 API 參考。當使用 ServiceBridge 呼叫服務、查詢可用方法、 寫遊戲代碼存取 ExternalModules 服務時使用。包含服務獲取、便利訪問器、常量、工具函數。'
---


# ServiceBridge API 參考

> 所有回覆必須使用繁體中文。

---

## 核心方法

| 方法 | 說明 |
|------|------|
| `initialize()` | 初始化 ServiceBridge |
| `addCustomConfigure(fn)` | 添加自定義配置（支持多個，累加） |
| `setCustomConfigure(fn)` | 設置自定義配置（覆蓋，**已棄用**） |
| `reset()` | 重置（用於測試） |

---

## 服務獲取方法

### Core Infrastructure

| 方法 | 返回類型 | 說明 |
|------|---------|------|
| `getLogger()` | `ILogger` | 日誌服務（Proxy，初始化前也安全） |
| `getEventSystem()` | `IEventSystem` | 事件系統 |
| `getNetworkService()` | `INetworkService` | 網絡服務 |
| `createObjectPool(...)` | `IObjectPool<T>` | 創建對象池 |
| `getGameStateManager()` | `IGameStateManager` | 遊戲狀態管理 |
| `getGameActionService()` | `IGameActionService` | 遊戲動作服務 |

### UI/UX Layer

| 方法 | 返回類型 | 說明 |
|------|---------|------|
| `getToastManager()` | `IToastManager` | Toast 管理器 |
| `getDialogManager()` | `IDialogManager` | Dialog 管理器 |
| `getLoadingManager()` | `ILoadingManager` | Loading 管理器 |
| `getSettingsManager()` | `ISettingsManager` | 設置管理器 |

### Other Services

| 方法 | 返回類型 | 說明 |
|------|---------|------|
| `getAudioManager()` | `IAudioManager` | 音頻管理器 |
| `getAnalytics()` | `IAnalytics` | 數據分析 |
| `getPlayerDataManager()` | `IPlayerDataManager` | 玩家數據管理 |
| `getGameApi()` | `GameApi` | 遊戲 API 客戶端 |
| `getGameService()` | `GameService` | 遊戲服務 |
| `getConfig()` | `IGameConfig` | 遊戲配置 |

---

## 便利訪問器

### Toast

```typescript
ServiceBridge.toast.show(message, options?);
ServiceBridge.toast.clear();
```

### Dialog

```typescript
ServiceBridge.dialog.show(options);
ServiceBridge.dialog.alert(message);
ServiceBridge.dialog.confirm(message, onConfirm, onCancel);
```

### Loading

```typescript
ServiceBridge.loading.show({ initialTip: "載入中..." });
ServiceBridge.loading.updateProgress(50, "50%");
ServiceBridge.loading.hide();
```

### Event（代理 EventSystem）

```typescript
ServiceBridge.on(event, callback, context?);
ServiceBridge.once(event, callback, context?);
ServiceBridge.off(event, callback?, context?);
ServiceBridge.emit(event, data?);
```

### Audio

```typescript
await ServiceBridge.playMusic(name, loop?);
await ServiceBridge.playSound(name);
```

### PlayerData

```typescript
ServiceBridge.playerData.getBalance();
ServiceBridge.playerData.getBetAmount();
```

### HTTP（代理 NetworkService）

```typescript
const response = await ServiceBridge.get(url);
const response = await ServiceBridge.post(url, data);
```

---

## 常量訪問器

```typescript
// 遊戲狀態
ServiceBridge.GAME_STATES.IDLE
ServiceBridge.GAME_STATES.SPINNING
ServiceBridge.GAME_STATES.SHOWING_RESULT

// 遊戲狀態事件
ServiceBridge.GAME_STATE_EVENTS.CHANGED
ServiceBridge.GAME_STATE_EVENTS.TRANSITION_FAILED

// 自動旋轉事件
ServiceBridge.AUTO_SPIN_EVENTS.START
ServiceBridge.AUTO_SPIN_EVENTS.STOP

// 玩家數據事件
ServiceBridge.PLAYER_DATA_EVENTS.BALANCE_CHANGED
ServiceBridge.PLAYER_DATA_EVENTS.BET_CHANGED
```

---

## Utils 工具函數

```typescript
// Function Utils
ServiceBridge.utils.throttle(fn, delay);
ServiceBridge.utils.debounce(fn, delay);

// Number Utils
ServiceBridge.utils.formatNumber(num, decimals);

// Array Utils
ServiceBridge.utils.splitArrayIntoSegments(array, segmentSize);
```

---

## Logger Proxy 機制

`ServiceBridge.getLogger()` 返回 Proxy：

```typescript
const logger = ServiceBridge.getLogger();
logger.info("test");
// 初始化前 → console.log
// 初始化後 → 真實 Logger
```

初始化前使用也安全，不會報錯。

---

## 注意事項

本文件列出的 API 可能隨 ServiceBridge 更新而變動。
如需確認最新 API，請直接閱讀 `bridge/ServiceBridge.ts` 源碼。
