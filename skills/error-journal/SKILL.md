---
name: error-journal
description: '錯誤日記系統。當開發中遇到非顯而易見的錯誤或踩坑時自動記錄到 .codex/errors.md； 當要做 Bootstrap 初始化、API 整合、新遊戲建立、Container 綁定、SlotReel 設定等 容易踩坑的任務時，先查閱過去的錯誤記錄避免重蹈覆轍。'
---


# 錯誤日記系統

> 所有回覆必須使用繁體中文。

---

## 記錄規則

### 什麼該記

- 非顯而易見的錯誤（不是 typo、不是語法錯誤）
- 有通用性的踩坑（其他遊戲或其他開發者也可能遇到）
- 順序依賴問題（如初始化順序錯誤）
- 架構限制導致的錯誤（如不能直接 import ext-module）
- API 使用方式的陷阱（如 rebind vs bind）

### 什麼不該記

- 單純的 typo 或拼寫錯誤
- 一次性的、不會重複發生的問題
- 已經在 skill 裡明確說明的規則（避免重複）

---

## 記錄格式

寫入專案的 `.codex/errors.md`，每筆記錄格式：

```markdown
## [簡短描述]
- **情境：** 在做什麼的時候遇到
- **錯誤：** 發生了什麼
- **原因：** 為什麼會錯
- **修正：** 怎麼修的
- **規則：** 以後要遵守什麼
- **標籤：** bootstrap / api / container / slot-reel / ext-module / ...
```

---

## 查閱時機

在做以下任務**之前**，先讀 `.codex/errors.md` 查看相關記錄：

- Bootstrap 初始化流程
- ServiceBridge / Container 綁定
- 新遊戲建立
- API 層實現（interceptors、GameApi）
- SlotReel hooks 設定
- ExternalModules 整合
- 任何涉及初始化順序的工作

---

## 維護規則

- 新記錄加在檔案末尾
- 如果某筆記錄已過時（問題已被架構層面解決），在標題加上 `[已解決]` 前綴
- 不要刪除舊記錄，保留作為歷史參考
