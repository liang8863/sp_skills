---
name: ext-module-ext-module-dev
description: '[slot-game-ext-module] ExternalModules 開發指南。新增 Service、修改現有模組、打包部署、 Container 綁定、Rollup 配置時使用。'
---

> Migrated from $(System.Collections.Hashtable.Src). Original Claude skill name: $origName. Scope: $(System.Collections.Hashtable.Scope).


# ExternalModules 開發

> 所有回覆必須使用繁體中文。

---

## 新增 Service 步驟

1. 在 `1.0/src/` 下適當目錄建立新檔案：
   - 核心基礎設施 → `core/`
   - UI 組件 → `uiCocos/`
   - 業務服務 → `services/`
2. 建立介面檔案 `IMyService.ts` 和實現檔案 `MyService.ts`
3. 在 `src/types/ServiceIdentifiers.ts` 添加識別符
4. 在 `src/core/Container.ts` 綁定服務（`.inSingletonScope()`）
5. 在對應的 `index.ts` 中導出
6. `npm run build` 重新打包
7. 在遊戲中透過 ServiceBridge 使用

---

## 專案結構

```
1.0/
├── src/
│   ├── core/               # 核心模組（Logger, EventSystem, Network, ObjectPool,
│   │                       #   InteractionLock, GameAction, GameState, HostBridge）
│   │   └── Container.ts    # DI 容器配置
│   ├── uiCocos/            # UI 組件（Toast, Dialog, Loading, WebView, GamePanel, Common）
│   ├── services/           # 業務服務（Settings, Analytics, PlayerData, IAudioManager）
│   ├── i18n/               # 多語言（I18nRegister + languages/）
│   ├── utils/              # 工具函數（Function, Number, String, Array）
│   ├── events/             # 事件定義
│   ├── types/              # 類型定義（ServiceIdentifiers, GameActionTypes, CocosTypes）
│   └── index.ts            # 主入口
├── dist/                   # 打包產物
│   ├── bundle.js           # 主要檔案（~85KB）
│   ├── bundle.js.map       # SourceMap（開發版才有）
│   └── index.d.ts          # TypeScript 類型定義
├── rollup.config.js
├── tsconfig.json
└── package.json
```

---

## 依賴管理

**打包進 bundle.js：**
- ✅ `inversify` — IoC 容器
- ✅ `reflect-metadata` — 裝飾器支援

**標記為 external（不打包）：**
- ❌ `cc` — Cocos Creator API，運行時從 window.cc 取得

**只用於開發：**
- `@cocos/creator-types` — TypeScript 類型檢查
- `rollup` + 插件、`typescript`

---

## Cocos API 使用方式

```typescript
// 開發時：import from "cc" 提供類型
import { Node, Label, director } from "cc";

// 打包時：Rollup 標記 cc 為 external，不打包
// 運行時：Cocos 遊戲提供 window.cc
```

---

## 打包命令

| 命令 | 說明 |
|------|------|
| `npm run build` | 開發版（帶 SourceMap） |
| `npm run build:prod` | 生產版（無 SourceMap，體積減少 67%） |
| `npm run watch` | 監聽模式，自動重新打包 |
| `npm run clean` | 清空 dist/ |
| `npm run serve`（根目錄） | 本地伺服器 port 8080 |

---

## 驗證打包

瀏覽器打開 `http://localhost:8080/1.0/test-bundle.html`，確認：
- ✅ window.ExternalModules 已暴露
- ✅ Core / UI / InversifyJS 模組可用
- ✅ 版本號正確
