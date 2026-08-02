---
name: run-msxrj-bridge-i18n-system
description: '[games/_run-slot-fe-msxrj/assets/scripts/bridge] 國際化系統。處理多語言翻譯、LanguageData、LocalizedLabel/Sprite/Spine、 語言切換、翻譯數據合併時使用。'
---

> Migrated from $(System.Collections.Hashtable.Src). Original Claude skill name: $origName. Scope: $(System.Collections.Hashtable.Scope).


# i18n 國際化系統

> 所有回覆必須使用繁體中文。

---

## 組件

| 組件 | 說明 |
|------|------|
| `LanguageData` | 語言數據管理核心 |
| `LocalizedLabel` | 文字本地化組件 |
| `LocalizedSprite` | 圖片本地化組件 |
| `LocalizedSpine` | Spine 動畫本地化組件 |
| `LanguagePreview` | 編輯器語言預覽 |

---

## LanguageData API

```typescript
import * as i18n from "./bridge/components/i18n/LanguageData";

// 初始化（傳入語言代碼）
i18n.init("zh");

// 翻譯
const text = i18n.t("game.title");
const nested = i18n.t("common.buttons.confirm");

// 語言切換後更新場景
i18n.updateSceneRenderers();

// 檢查就緒狀態
if (i18n.ready) { /* ... */ }
```

---

## 翻譯數據來源

翻譯來自兩個來源，ServiceBridge 初始化時自動合併：

1. **ExternalModules** — `ext-module/1.0/src/i18n/languages/`（共用翻譯）
2. **遊戲專案** — `resources/i18n/`（遊戲專屬翻譯）

合併透過 `I18nRegister.register()` 完成，遊戲專屬翻譯會覆蓋共用翻譯的同名 key。

---

## 使用流程

```typescript
// 1. Bootstrap 中初始化
const lang = await getHostBridge().waitForLanguage();
i18n.init(lang);

// 2. ServiceBridge.initialize() 時自動調用 I18nRegister.register()

// 3. 在 Cocos 場景中使用 LocalizedLabel 組件（編輯器設定 key）

// 4. 在代碼中使用
const welcomeText = i18n.t("game.welcome");
```

---

## 語系檔案格式

語系檔案為 TypeScript 模組（`.ts`），透過 import 打包進主程式：

```typescript
// resources/i18n/en.ts
window.languages = window.languages || {};
window.languages["en"] = {
  game: { title: "My Game", welcome: "Welcome!" },
  loading: { modulesLoaded: "Modules loaded" },
};

// resources/i18n/zh.ts
window.languages = window.languages || {};
window.languages["zh"] = {
  game: { title: "我的遊戲", welcome: "歡迎！" },
  loading: { modulesLoaded: "模組載入完成" },
};
```

在 Bootstrap.ts 中 import 確保打包：

```typescript
import '../resources/i18n/en';
import '../resources/i18n/zh';
```

```
resources/i18n/
├── en.ts    ← TypeScript 模組（非 JSON）
├── zh.ts
└── ja.ts
```

---

## 本地化資源（圖片等）

```
resources/localization/
├── en/
│   └── banner.png
├── zh/
│   └── banner.png
└── ja/
    └── banner.png
```

使用 `LocalizedSprite` 組件，自動根據語言載入對應圖片。
