---
name: code-review-workflow
description: 'Migrated Claude /code-review workflow. Use when the user asks for code review, file review, project review, or session-change review in Slot FE Client.'
---

> This Codex skill was migrated from .claude/commands/code-review.md. Claude slash-command mechanics do not exist here; follow this workflow when the user asks for the equivalent command behavior.

# Code Review

> 所有回覆必須使用繁體中文。

## 參數

用戶輸入：`$ARGUMENTS`

**參數解析：**

| 參數類型 | 範例 | 行為 |
|---------|------|------|
| 專案名稱 | `mjhl`、`tel`、`root` | review 該專案所有未 commit 的 `.ts` 變更檔案 |
| 檔案名稱 | `GameService.ts` | 搜尋並 review 該檔案（不限於變更，完整 review） |
| 檔案路徑 | `games/slot-fe-mjhl/assets/scripts/services/GameService.ts` | review 指定路徑的檔案 |
| `ss` | `/code-review ss` | review 本次對話中所有被 Edit/Write 過的 `.ts` 檔案 |

**專案對照表（同 `/commit`）：**

| 參數 | 專案路徑 |
|------|---------|
| `mjhl` | `games/slot-fe-mjhl/` |
| `sjnw` | `games/slot-fe-sjnw/` |
| `xltb` | `games/slot-fe-xltb/` |
| `xltb2` | `games/slot-fe-xltb2/` |
| `dscj` | `games/slot-fe-dscj/` |
| `dypd` | `games/slot-fe-dypd/` |
| `wldd` | `games/slot-fe-wldd/` |
| `tel` | `games/slot-game-template/` |
| `bridge` | `games/slot-game-template/assets/scripts/bridge/` |
| `module` | `slot-game-ext-module/` |
| `root` | `.`（slot-fe-client 根專案） |

## 執行流程

1. **確定範圍**：
    - 專案名稱 → `git diff --name-only` 找出該專案所有未 commit 的 `.ts` 檔案
    - 檔案名稱/路徑 → 直接定位該檔案
    - `ss` → 從本次對話的工具呼叫記錄中收集所有被 Edit/Write 過的 `.ts` 檔案
2. **委派 review**：將檔案清單交給 `code-quality` subagent 執行審查
3. **呈現結果**：

### 輸出格式

```
## Code Review 結果

### 📁 檔案名稱.ts

**✅ 通過** 或 **⚠️ 發現 N 個問題**

| # | 嚴重度 | 行號 | 問題 | 建議 |
|---|--------|------|------|------|
| 1 | Critical | L42 | 描述 | 修正建議 |
| 2 | Warning | L87 | 描述 | 修正建議 |

（重複每個檔案）

### 📊 總結
- 審查檔案數：N
- Critical：N / Warning：N / Suggestion：N
```

4. **文件更新檢查**（僅適用 `tel`、`bridge`、`module`，其餘專案跳過此步）：
    - 比對變更檔案與該專案的 `README.md`，判斷是否需要更新：
      - 新增了 `.ts` / `.prefab` 檔案 → README 的專案結構是否有列出
      - 新增了功能模組（如 BigWinShow）→ README 是否有對應的功能說明
      - 修改了 API / 流程 → README 的操作步驟是否仍正確
    - 如判斷需要更新 → 列出預計更新的段落和摘要，使用 `AskUserQuestion`：
      - 「更新文件」— 執行更新
      - 「跳過」— 不更新
    - 如不需要更新 → 顯示「📄 文件無需更新」

## 審查重點

（與 `code-quality` agent 一致）

- **型別安全**：any 使用是否合理、型別斷言是否安全
- **架構違規**：是否直接 import ext-module 源碼（應透過 ServiceBridge）
- **錯誤處理**：async/await 是否正確、Promise 是否有 catch
- **命名規範**：檔案/類/方法/變數是否符合專案慣例
- **重構痕跡**：過渡性註解、deprecated 標記、unused re-exports
- **Cocos 特有**：生命週期順序、組件引用方式、記憶體洩漏風險
- **禁止非必要 getComponent**：能透過 `@property` 直接綁定的組件，不應在運行時用 `getComponent` 取得（動態生成節點、運行時條件取組件等例外情況除外）

## 重要規則

- **只讀不改**：只提供建議，不修改任何檔案
- 每個問題標明嚴重度：`Critical` / `Warning` / `Suggestion`
- 如無問題，直接顯示「✅ 全部通過，未發現問題」
- **簡體中文的註解和說明是正常的**（後續維護者使用簡體），不要標記為問題
- **不建議使用 ES2016+ API**（如 `includes`、`Object.entries`），Cocos Creator 3.8 目標為 ES2015
