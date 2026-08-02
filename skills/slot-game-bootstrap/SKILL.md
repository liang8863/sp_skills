---
name: slot-game-bootstrap
description: 'Slot 遊戲的 Bootstrap 初始化流程。當建立新遊戲、修改啟動流程、 調試初始化順序問題、設置自定義服務配置時使用。'
---


# Bootstrap 初始化流程

> 所有回覆必須使用繁體中文。

---

## 標準初始化順序

```typescript
async onLoad() {
  // 1. HostBridge（最早，不依賴 ExternalModules）
  getHostBridge().initialize();

  // 2. 等待語言設置
  const lang = await getHostBridge().waitForLanguage();

  // 3. 初始化 i18n
  i18n.init(lang);

  // 4. 自定義服務配置（必須在 initialize 之前）
  ServiceBridge.addCustomConfigure(() => {
    // 綁定 LoadingManager、ToastManager 等...
  });

  // 5. 載入 ExternalModules
  await Loader.getInstance().load(GameConfig.externalModulesUrl);

  // 6. 初始化 SlotReel Logic（ExternalModules 載入後）
  this.initSlotReelLogic();

  // 7. 音頻 + ServiceBridge 初始化
  await ServiceBridge.getAudioManager().initialize(GameConfig.audio);
  ServiceBridge.initialize();

  // 8. 登入
  await this.performLogin();

  // 9. 通知 Host
  getHostBridge().notifyGameReady();

  // 10. 開始遊戲
  this.startGame();
}
```

---

## 配置載入優先級

```
gameConfig.json（遠程配置）
        ↓ 覆蓋
GameConfig.ts（本地默認）
```

---

## 自定義服務綁定

```typescript
ServiceBridge.addCustomConfigure(() => {
  const { container, SERVICE_IDENTIFIERS } = window.ExternalModules;
  const logger = container.get(SERVICE_IDENTIFIERS.LOGGER);

  // 替換服務（用 rebind）
  const customToast = new MyToastManager(logger);
  container.rebind(SERVICE_IDENTIFIERS.TOAST_MANAGER)
    .toConstantValue(customToast);

  // 新增服務（用 bind）
  const loadingManager = new LoadingManager(logger, { loadingView });
  container.bind(SERVICE_IDENTIFIERS.LOADING_MANAGER)
    .toConstantValue(loadingManager);
});
```

**重點：**
- 用 `addCustomConfigure`（累加），不用 `setCustomConfigure`（覆蓋，已棄用）
- 不使用 `@injectable()` 裝飾器
- 用 `toConstantValue()` 綁定手動建立的實例

---

## 常見錯誤

```typescript
// ❌ addCustomConfigure 在 initialize 之後 → 不會生效
ServiceBridge.initialize();
ServiceBridge.addCustomConfigure(...);  // 太晚了！

// ❌ 忘記 await Loader.load() → ExternalModules 未就緒
Loader.getInstance().load(url);  // 缺少 await
ServiceBridge.initialize();      // window.ExternalModules 還沒準備好

// ❌ 在 ExternalModules 載入前存取服務 → 報錯
// （getLogger() 例外，它有 Proxy 機制，初始化前也安全）
```
