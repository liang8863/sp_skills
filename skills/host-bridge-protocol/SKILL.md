---
name: host-bridge-protocol
description: 'Host 頁面通訊協議。當處理 iframe 通訊、token 管理、語言設置、 彈窗互動、HostBridge 相關開發時使用。'
---


# Host 通訊協議

> 所有回覆必須使用繁體中文。

---

## 概述

遊戲運行在 iframe 中，透過 PostMessage 與 Vue Host 頁面通訊。
HostBridge 封裝了所有通訊細節。

---

## 通訊協議

| Action | 方向 | 說明 |
|--------|------|------|
| `SET_TOKEN` | Host → Game | 下發 token 和語系 |
| `SET_LANGUAGE` | Host → Game | 下發語言設置 |
| `REQUEST_TOKEN` | Game → Host | 請求 token |
| `REQUEST_LANGUAGE` | Game → Host | 請求語言設置 |
| `OPEN_MODAL` | Game → Host | 請求打開彈窗 |
| `MODAL_OPENED` | Host → Game | 彈窗已打開確認 |
| `MODAL_CLOSED` | Host → Game | 彈窗已關閉確認 |
| `AUTH_INVALID` | Game → Host | Token 失效 |
| `GAME_READY` | Game → Host | 遊戲資源載入完成 |

**消息格式：** `{ type: "GAME_HOST", action: "...", payload: {} }`

---

## 使用方式

```typescript
import { getHostBridge } from "./bridge";

const hostBridge = getHostBridge();

// 初始化（最早執行，不依賴 ExternalModules）
hostBridge.initialize();

// 等待 token 和語言
const token = await hostBridge.waitForToken();
const lang = await hostBridge.waitForLanguage();

// 打開彈窗
hostBridge.openModal("paytable");
hostBridge.openModal("rules");
hostBridge.openModal("history");
hostBridge.openModal("balance");

// 監聽彈窗事件
hostBridge.onModalOpened((payload) => {
  console.log("彈窗已打開:", payload.modalKey);
});

hostBridge.onModalClosed((payload) => {
  console.log("彈窗已關閉:", payload.modalKey);
});

// 報告 token 失效
hostBridge.reportAuthInvalid(401);

// 通知遊戲就緒
hostBridge.notifyGameReady();
```

---

## 特性

- **不依賴 ExternalModules** — 可在 Cocos 載入後立即初始化
- **使用 Logger Proxy** — 初始化前自動使用 console
- **單例模式** — 全局唯一實例（透過 `getHostBridge()` 獲取）
- **環境判斷** — `isInIframe()` 判斷是否在 iframe 中

---

## 故障排查

| 問題 | 解決 |
|------|------|
| 消息發送/接收失敗 | 確認 `isInIframe()` 返回 true |
| Host 沒回應 | 確認 Host 頁面已實現對應消息處理 |
| 消息格式錯誤 | 檢查格式：`{ type: "GAME_HOST", action, payload }` |
