---
name: hbfy-hbfy-game-logic
description: '[games/hbfy] HBFY 黑幫風雲的專屬遊戲邏輯。處理 Cluster Pay 集群消除、 大獎展示、HBFY 的 API 調用、符號映射時使用。'
---

> Migrated from $(System.Collections.Hashtable.Src). Original Claude skill name: $origName. Scope: $(System.Collections.Hashtable.Scope).


# HBFY 專屬邏輯

> 所有回覆必須使用繁體中文。

---

## 遊戲規格

- 6 軸 × 4 行
- Cluster Pay（集群消除）
- TODO: 補充特殊機制

---

## 狀態機

```
STANDBY → START_SPIN → SPINNING → END_SPIN → STANDBY
                                      │
                                (有 Cascade？)
                                      │
                              SHOWING_CASCADE
                                      │
                               (有 Free Game？)
                                      │
                               FREE_GAME_MODE
```

---

## GameService Hooks（HBFY 覆寫）

```typescript
{
  gameCode: "HBFY",
  // TODO: 根據遊戲需求覆寫 hooks
}
```

---

## 符號系統

| 後端代碼 | 前端圖標 | 說明 |
|---------|---------|------|
| TODO | TODO | 待後端 API 定義後填入 |

---

## API 結構

- `POST /spin` — Spin 請求
- `GET /last-spin` — 查詢上次未完成的 spin
- `POST /login` — 登入
- `GET /balance` — 查詢餘額

> TODO: 根據後端 API 格式補充詳細欄位

---

## 專屬事件

目前使用模板預設事件，待遊戲開發時新增專屬事件。
