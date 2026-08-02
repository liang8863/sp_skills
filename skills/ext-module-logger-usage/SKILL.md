---
name: ext-module-logger-usage
description: '[slot-game-ext-module] Logger 使用規範。在 ExternalModules 中寫日誌、調試、 選擇日誌級別時使用。禁止使用 console.log。'
---

> Migrated from $(System.Collections.Hashtable.Src). Original Claude skill name: $origName. Scope: $(System.Collections.Hashtable.Scope).


# Logger 使用規範

> 所有回覆必須使用繁體中文。

---

## ⚠️ 核心規則：禁止使用 console.log

在 ExternalModules 開發中，**必須使用 Logger**，禁止使用 `console.log`、`console.error` 等原生方法。

---

## 在 Service 中使用（推薦：依賴注入）

```typescript
import { injectable, inject } from 'inversify';
import { ILogger } from './core/ILogger';
import { SERVICE_IDENTIFIERS } from './types/ServiceIdentifiers';

@injectable()
export class MyService {
  constructor(
    @inject(SERVICE_IDENTIFIERS.LOGGER) private logger: ILogger
  ) {}

  doSomething(): void {
    this.logger.debug('調試信息');
    this.logger.info('提示信息');
    this.logger.warn('警告信息');
    this.logger.error('錯誤信息', error);
  }
}
```

---

## 在 Cocos Component 中使用（直接實例化）

```typescript
import { Component } from 'cc';
import { Logger } from './core/Logger';

export class MyComponent extends Component {
  private logger = new Logger();

  start() {
    this.logger.info('組件啟動');
  }
}
```

---

## 日誌級別

| 級別 | 使用場景 | 開發環境 | 生產環境 |
|------|---------|---------|---------|
| `debug` | 詳細調試信息 | ✅ 輸出 | ❌ 不輸出 |
| `info` | 一般提示信息 | ✅ 輸出 | ❌ 不輸出 |
| `warn` | 警告信息 | ✅ 輸出 | ❌ 不輸出 |
| `error` | 錯誤信息 | ✅ 輸出 | ✅ 輸出 |

---

## 環境自動判斷

Logger 會自動檢測運行環境：
- **開發環境**（localhost / 127.0.0.1 / file://）→ 輸出所有日誌
- **生產環境**（其他域名）→ 僅輸出 ERROR

---

## 為什麼用 Logger 而不是 console？

1. **環境自動適配** — 生產環境不會洩漏調試資訊
2. **統一格式** — 帶時間戳、顏色標記、日誌級別
3. **可控制** — 可動態調整日誌級別
4. **可測試** — 可在測試中 mock Logger
