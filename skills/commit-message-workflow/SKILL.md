---
name: commit-message-workflow
description: 'Migrated Claude /commit workflow. Use when the user explicitly asks to generate a commit message or inspect pending changes without committing; do not use when the user asks Codex to actually create a commit.'
---

> This Codex skill was migrated from .claude/commands/commit.md. Claude slash-command mechanics do not exist here; follow this workflow when the user asks for the equivalent command behavior.

# 生成 Commit 訊息

> 所有回覆必須使用繁體中文。

## 參數

用戶輸入：`$ARGUMENTS`

**參數解析：** 以空格拆分，第一個為專案名稱，第二個為選項。

- `/commit mjhl` → 專案=mjhl，執行 review
- `/commit mjhl n` → 專案=mjhl，跳過 review
- `/commit ss n` → session 模式，跳過 review

| 選項 | 說明 |
|------|------|
| （無） | 預設執行 Code Review |
| `n` | 跳過 Code Review（已手動 `/code-review` 過或不需要時使用） |

**參數對照表：**

| 參數     | 專案路徑                                                                     |
| -------- | ---------------------------------------------------------------------------- |
| `mjhl`   | `games/slot-fe-mjhl/`                                                        |
| `sjnw`   | `games/slot-fe-sjnw/`                                                        |
| `xltb`   | `games/slot-fe-xltb/`                                                        |
| `xltb2`  | `games/slot-fe-xltb2/`                                                       |
| `dscj`   | `games/slot-fe-dscj/`                                                        |
| `dypd`   | `games/slot-fe-dypd/`                                                        |
| `wldd`   | `games/slot-fe-wldd/`                                                        |
| `tel`    | `games/slot-game-template/`                                                  |
| `bridge` | `games/slot-game-template/assets/scripts/bridge/`                            |
| `module` | `slot-game-ext-module/`                                                      |
| `root`   | `.`（slot-fe-client 根專案）                                                 |
| `all`    | 以上全部，由下到上依序掃描                                                   |
| `ss`     | 掃描本次對話中所有異動過的檔案（跨專案），自動歸類並生成各專案的 commit 訊息 |

- 如果參數為空或無法識別，提示用戶可用的參數
- 如果參數是遊戲 ID（如 `mjhl`），也要匹配 `slot-fe-mjhl`
- 未來新增遊戲（`games/slot-fe-*`）也要能自動識別

## 執行流程

### 一般模式（指定專案）

1. **掃描變更**：對指定專案執行 `git status --short` 和 `git diff --stat`
2. **Code Review**（第二參數為 `n` 時跳過此步）：委派 `code-quality` subagent review 所有變更的 `.ts` 檔案
    - 只 review 有實際變更的 TypeScript 檔案（跳過 .meta、.json、.md 等）
    - review 重點：型別安全、命名規範、潛在 bug、未處理的 error
    - **注意**：Cocos Creator 3.8 目標為 ES2015，不可建議使用 `includes`、`Object.entries` 等 ES2016+ API
    - 如有發現問題，列出「⚠️ Review 發現」區塊（檔案、行號、問題描述、建議），然後使用 `AskUserQuestion` 提供選項：
      - 「修正問題」— 自動修正後繼續流程
      - 「跳過，繼續」— 不修正，繼續下一步
    - 如無問題，簡單標示「✅ Review 通過」，直接繼續
3. **文件更新檢查**（僅適用 `tel`、`bridge`、`module`，其餘專案跳過此步）：
    - 比對變更檔案與該專案的 `README.md`，判斷是否需要更新：
      - 新增了 `.ts` / `.prefab` 檔案 → README 的專案結構是否有列出
      - 新增了功能模組（如 BigWinShow）→ README 是否有對應的功能說明
      - 修改了 API / 流程 → README 的操作步驟是否仍正確
    - 如判斷需要更新 → 先顯示預計異動的具體內容，再使用 `AskUserQuestion` 確認：
      - 顯示格式：列出每個要修改的段落，用 diff 風格標示新增（`+`）/ 刪除（`-`）/ 修改的行
      - 如果是新增段落，完整展示要插入的內容及插入位置
      - 選項：
        - 「更新文件」— 執行更新後繼續
        - 「跳過」— 不更新，繼續產出 commit 訊息
    - 如不需要更新 → 顯示「📄 文件無需更新」，直接繼續
    - 如果用戶選擇更新，更新完成後將更新的檔案一併納入建議 commit 清單
4. **分析變更**：
    - 查看最近 3 筆 commit 訊息以對齊風格
    - 區分「有意義的變更」和「無關變更」（如 Cocos 編輯器 .meta 檔、profiles/）
5. **產出訊息**：
    - 建議 commit 的檔案清單
    - commit 訊息（遵循 `feat: / fix: / refactor: / docs:` 格式，簡潔 1-2 行）
    - 如有無關變更，另外標註「非本次工作，建議另外處理」

### session 模式（本次工作異動）

1. **回溯對話**：從本次對話的工具呼叫記錄中，收集所有被 Edit/Write 過的檔案路徑
2. **交叉比對**：對每個檔案執行 `git status` 確認是否仍有未 commit 的變更（排除已 commit 或已還原的）
3. **歸類分組**：依檔案路徑自動歸入對應專案（root / template / bridge / ext-module / 各遊戲）
4. **Code Review**（第二參數為 `n` 時跳過此步）：對每個專案的變更 `.ts` 檔案，委派 `code-quality` subagent review（規則同一般模式，含互動修正選項）
5. **文件更新檢查**：對歸類結果中屬於 `tel`、`bridge`、`module` 的專案，逐一執行文件更新檢查（邏輯同一般模式 step 3）
6. **依序產出**：由下到上（bridge → 遊戲 → template → ext-module → root）逐一產出 commit 訊息
7. **標註非本次**：如某專案有變更但不屬於本次對話的操作，歸入「非本次工作」

## 重要規則

- **絕對不執行 `git add` 或 `git commit`**，只產出訊息
- 不加 `Co-Authored-By`
- `root` 的 commit 如果包含 submodule 指向更新，要在訊息中提到
- `.codex/settings.local.json` 或 `.claude/settings.local.json` 是本機設定，提醒用戶不要 commit
