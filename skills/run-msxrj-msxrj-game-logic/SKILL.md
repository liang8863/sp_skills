---
name: run-msxrj-msxrj-game-logic
description: '[games/_run-slot-fe-msxrj] MSXRJ Queen of Bounty 的專屬遊戲邏輯。處理 Cascade 連消、免費旋轉選擇、 倍數遞增系統、MSXRJ 的 API 調用、符號映射、音效配置時使用。'
---

> Migrated from $(System.Collections.Hashtable.Src). Original Claude skill name: $origName. Scope: $(System.Collections.Hashtable.Scope).


# MSXRJ 專屬邏輯

> 所有回覆必須使用繁體中文。

---

## 遊戲規格

- **遊戲 ID：** MSXRJ
- **遊戲名稱：** Queen of Bounty
- **轉軸：** 5 軸 × 3 行、20 條中獎線
- **API 格式：** PG SOFT（dt.si）

---

## 符號系統

| 後端代碼 | 符號 | 前端索引 | 類型 |
|---------|------|---------|------|
| 0 | Wild（百搭） | 8 | 特殊（第 2、3、4 軸） |
| 1 | Scatter（奪寶） | 0 | 特殊（3 個觸發免費旋轉） |
| 2 | 人頭 | 1 | 高賠付 |
| 3 | 槍 | 2 | 高賠付 |
| 4 | 懷錶 | 3 | 中賠付 |
| 5 | 地圖 | 4 | 中賠付 |
| 6 | A | 5 | 低賠付 |
| 7 | K | 6 | 低賠付 |
| 8 | Q | 7 | 低賠付 |

映射函式：`getMsxrjIconAndBgIndex()`（在 `data/MsxrjResourcePath.ts`）

---

## 倍數系統

| 模式 | 倍數階梯 |
|------|---------|
| 主遊戲 | [1, 2, 3, 5] |
| 免費旋轉選項 1 | 依 GameConfig 設定 |
| 免費旋轉選項 2 | 依 GameConfig 設定 |
| 免費旋轉選項 3 | 依 GameConfig 設定 |

每次 Cascade 倍數遞增，Cascade 結束後重置。

---

## GameService Hooks（MSXRJ 覆寫）

```typescript
{
  gameCode: "MSXRJ",

  // Cascade 判斷
  isCascade: (result) => !result.isSpinFinished,

  // 上次旋轉未完成判斷
  isLastSpinUnfinished: (result) => !result.isFinished,

  // 區分普通/消除結果事件
  getSpinResultEventName: (result) =>
    result.isNewSpin ? GAME_EVENTS.SPIN_RESULT : GAME_EVENTS.CASCADE_RESULT,

  // Spin 完成後處理（倍數變化、免費旋轉選擇）
  onSpinComplete: async (result) => {
    // 追蹤倍數變化並發射事件
    // 檢查是否觸發免費旋轉選擇
  },
}
```

---

## 免費旋轉選擇

觸發條件：3 個 Scatter 符號

流程：
1. 顯示選擇面板（3 種選項）
2. 玩家選擇後呼叫 `confirmFreeSpinSelect()`
3. 進入免費旋轉模式（使用選定的倍數階梯）

---

## GameApi

| 方法 | 說明 |
|------|------|
| `spin(request)` | 執行旋轉 |
| `lastSpin(request)` | 獲取上次旋轉結果 |
| `login(request)` | 登入 |
| `balance(request)` | 獲取餘額 |

**API 格式：** PG SOFT（dt.si 結構）

---

## 音頻配置

```typescript
audio: {
  bgm: {
    normal: "sound/nbgm",       // 一般模式 BGM
    freeGame: "sound/fbgm",     // Free Game BGM
  },
  sfx: {
    sprites: {
      slot: { src: "sound/ssfx", sprite: { ... } },
      voice: { src: "sound/svoice", sprite: { ... } },
      button: { src: "sound/sbtn", sprite: { ... } },
    },
  },
}
```

倍數切換音效：`getMultiplierSoundKey()` / `getMultiplierVoiceKey()`
