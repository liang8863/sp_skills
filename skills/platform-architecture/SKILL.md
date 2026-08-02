---
name: platform-architecture
description: 'Slot 遊戲平台整體架構設計。當討論架構、模組關係、分層設計、 跨專案設計決策、新功能如何融入架構時使用。'
---


# 平台架構

> 所有回覆必須使用繁體中文。

---

## 技術棧

Cocos Creator 3.8 + TypeScript + InversifyJS

---

## 倉庫結構

```
slot-fe-client/                    ← monorepo（Git submodule 管理）
├── ext-module/                    ← slot-game-ext-module（共用核心模組）
│   ├── 1.0/src/...               （打包成 UMD bundle.js）
│   └── 2.0/                      （未來版本）
└── games/
    ├── slot-game-template/        ← 遊戲模板
    ├── slot-fe-mjhl/              ← 麻將胡了
    ├── slot-fe-xxx/               ← 其他遊戲（50+）
    └── 每個遊戲內含：
        └── assets/scripts/bridge/ ← Bridge 層（submodule，同一份）
```

---

## 分層架構

```
┌─────────────────────────────────────────────────────┐
│                    遊戲代碼                          │
│  Bootstrap → GameService → Controllers              │
│         │           │            │                  │
│         ▼           ▼            ▼                  │
│  ┌─────────────────────────────────────────────────┐│
│  │         ServiceBridge（唯一入口）                ││
│  └─────────────────────────────────────────────────┘│
└────────────────────────┼────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│              ExternalModules（bundle.js）             │
│  Core: Logger, EventSystem, NetworkService,          │
│        ObjectPool, InteractionLock, GameAction,      │
│        GameState, HostBridge                         │
│  UI:   Toast, Dialog, Loading, WebView, GamePanel    │
│  Svc:  Settings, Audio, Analytics, PlayerData        │
│  Util: Function, Number, String, Array               │
└────────────────────────┼────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│           Host 頁面（Vue 外殼，iframe）              │
└─────────────────────────────────────────────────────┘
```

---

## 核心原則

1. **ServiceBridge 是唯一入口** — 遊戲代碼不直接碰 ExternalModules
2. **事件驅動** — GameService 發射事件 → Controllers 監聽
3. **接口導向** — 自定義組件實現 IXxxView 接口
4. **無裝飾器** — 遊戲代碼不使用 InversifyJS 裝飾器
5. **版本化** — ext-module 用 1.0/, 2.0/ 路徑隔離
6. **動態載入** — bundle.js 透過 `<script>` 標籤動態載入，掛到 window.ExternalModules

---

## ext-module 與遊戲專案隔離規則

**遊戲專案與 ext-module 是完全獨立的專案，不能直接 import ext-module 源碼。**

```typescript
// ❌ 絕對禁止：直接引用 ext-module 源碼
import { Logger } from '../../ext-module/1.0/src/core/Logger';
import { EventSystem } from '../../../../slot-game-ext-module/1.0/src/core/EventSystem';

// ✅ 正確：透過 ServiceBridge 取得服務
import { ServiceBridge } from './bridge';
const logger = ServiceBridge.getLogger();

// ✅ 正確：Bootstrap 階段透過 window.ExternalModules
const { container, SERVICE_IDENTIFIERS } = window.ExternalModules;

// ✅ 正確：bridge/types/ 提供編譯時型別檢查（編譯後消失，不產生實際引用）
import type { ILogger } from './bridge/types/core';
```

**為什麼：**
- ext-module 打包成 UMD bundle.js，運行時透過 `<script>` 動態載入到 `window.ExternalModules`
- 遊戲是獨立的 Cocos 專案，與 ext-module 沒有直接的模組依賴關係
- `bridge/types/` 的 `import type` 只用於編譯時檢查，不會產生 runtime 引用
- 直接 import 會導致打包失敗或重複打包 InversifyJS 等相依套件

---

## 通訊方式

| 誰 → 誰 | 方式 | 具體機制 |
|----------|------|---------|
| 遊戲 ↔ Host 頁面 | PostMessage | HostBridge 封裝，iframe 跨域 |
| 遊戲 → ext-module | window.ExternalModules | Loader 動態 `<script>` 載入 |
| 遊戲代碼 → 服務 | ServiceBridge | 唯一入口，從 Container 取服務 |
| 服務之間 | EventSystem | 發布/訂閱模式 |
| ext-module → Cocos API | window.cc | 打包時標記 external，運行時用 Cocos 全域物件 |

---

## Cocos 專案 vs 非 Cocos 專案

| 專案 | 是否 Cocos | 說明 |
|------|-----------|------|
| slot-fe-client | ❌ | 純管理層 monorepo |
| ext-module | ❌ | 純 TS + Rollup，打包成 UMD |
| bridge | ❌（跑在 Cocos 內） | 獨立 repo，嵌入 Cocos 專案 |
| template / 各遊戲 | ✅ | Cocos Creator 3.8 專案 |
