---
name: run-msxrj-bridge-bridge-internals
description: '[games/_run-slot-fe-msxrj/assets/scripts/bridge] Bridge 層內部開發。修改 Loader、EventBridge、HostBridge 內部實現、 ServiceBridge 核心邏輯、類型同步機制時使用。'
---

> Migrated from $(System.Collections.Hashtable.Src). Original Claude skill name: $origName. Scope: $(System.Collections.Hashtable.Scope).


# Bridge 內部開發

> 所有回覆必須使用繁體中文。

---

## 目錄結構

```
bridge/
├── index.ts                # 總入口（統一導出）
├── ServiceBridge.ts        # 核心：配置 + 初始化 + API
├── Loader.ts               # ExternalModules 動態載入器
├── EventBridge.ts          # 事件生命週期管理
├── HostBridge.ts           # Host 頁面通訊
├── types/                  # 類型定義（分層組織）
│   ├── core/               # ILogger, IEventSystem, INetworkService...
│   ├── uiCocos/            # IToastManager, IDialogManager...
│   │   └── GamePanel/      # SlotReel 相關類型
│   ├── services/           # ISettingsManager, IAudioManager...
│   ├── bridge/             # IServiceLocator, ISlotGameExtModule, IGameConfig
│   ├── events/             # 事件類型常量
│   └── utils/              # IUtils
└── components/
    └── i18n/               # 國際化組件
```

---

## Loader

動態建立 `<script>` 標籤載入 bundle.js：
- 載入完成後 `window.ExternalModules` 可用
- 支援重試機制（載入失敗時）
- 單例模式

```typescript
await Loader.getInstance().load(bundleUrl);
// 此時 window.ExternalModules 已可用
```

---

## EventBridge

綁定 Cocos 節點，節點銷毀時自動清理所有事件監聽：

```typescript
const events = new EventBridge(this.node);
events.on("game:start", handler, this);
// 節點銷毀時自動 clearAll()
```

API: `on`, `once`, `off`, `emit`, `clear`, `clearAll`, `destroy`,
`getListenerCount`, `getEventListenerCount`, `isDestroyed`

---

## Logger Proxy

`ServiceBridge.getLogger()` 返回 Proxy 物件：
- **初始化前**：所有呼叫轉發到 console（安全使用）
- **初始化後**：轉發到真實 Logger 實例

---

## 類型同步機制

`types/` 下的類型從 ext-module 的 `.d.ts` 編譯產物導出：

```typescript
// types/core/index.ts
export type { ILogger, LogLevel }
  from "../../../../../../../ext-module/1.0/dist/core/Logger/ILogger";
```

- 使用相對路徑引用（依賴倉庫結構）
- 只提供編譯時檢查，編譯後完全消失
- 如果 ext-module 介面變更，需要重新 build ext-module 產生新的 .d.ts

---

## 責任劃分

| 組件 | 職責 |
|------|------|
| ExternalModules | Container + 默認服務實現 + 接口定義 |
| ServiceBridge | 配置層（rebind）+ 初始化層 + 統一 API |
| HostBridge | iframe ↔ Host PostMessage 通訊 |
| EventBridge | 事件生命週期，綁定 Cocos 節點 |
| Loader | ExternalModules 動態載入，重試機制 |
| 遊戲代碼 | 只透過 ServiceBridge 訪問服務 |

---

## 故障排查

| 問題 | 解決 |
|------|------|
| window.ExternalModules 未載入 | 確認 bundleUrl 正確、bundle.js 路徑存在 |
| 自定義服務未生效 | 確認 addCustomConfigure 在 initialize 之前 |
| TypeScript 找不到類型 | 確認從 bridge/types 導入、ext-module .d.ts 已就位 |
| HostBridge 消息不通 | 確認在 iframe 中、Host 已實現消息處理 |
