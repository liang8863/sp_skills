---
name: monorepo-management
description: 'Monorepo 跨專案同步管理。當修改 bridge、ext-module、template 等共用模組時， 提醒同步更新到各遊戲專案。也涵蓋 submodule 日常操作。'
---


# Monorepo 跨專案同步管理

> 所有回覆必須使用繁體中文。

---

## 何時需要同步

以下操作完成後，**必須提醒用戶同步到相關專案**：

| 你改了什麼 | 影響範圍 | 需要做什麼 |
|-----------|---------|-----------|
| **bridge**（`assets/scripts/bridge/`） | 所有遊戲 | 更新每個遊戲的 bridge submodule 指向 |
| **ext-module**（`slot-game-ext-module/`） | 所有遊戲（runtime） | 重新打包 bundle.js，各遊戲重新整合測試 |
| **template**（`games/slot-game-template/`） | 未來新遊戲；現有遊戲視情況 | 評估是否需要回推到現有遊戲 |
| **遊戲內的 bridge** | 僅該遊戲 | 該遊戲 commit 後，root 更新 submodule 指向 |
| **遊戲專案本身** | 僅該遊戲 | 遊戲 commit 後，root 更新 submodule 指向 |

---

## Bridge 同步（最常見）

Bridge 是每個遊戲的 `assets/scripts/bridge/`，全部指向同一個 Git repo。

### 修改流程

1. 在 template 的 bridge 目錄做修改並測試
2. commit & push bridge repo
3. 到每個遊戲更新 bridge 指向：

```bash
# 逐一更新各遊戲的 bridge submodule
for game in games/slot-fe-*/; do
  cd "$game/assets/scripts/bridge"
  git pull origin main
  cd ../../../..
done
```

4. 各遊戲 commit bridge 指向更新：

```bash
cd games/slot-fe-mjhl
git add assets/scripts/bridge
git commit -m "chore: update bridge submodule"
cd ../..
```

5. root 更新遊戲 submodule 指向

### 目前有 bridge 的專案

- `games/slot-game-template/assets/scripts/bridge/`
- `games/slot-fe-mjhl/assets/scripts/bridge/`
- `games/slot-fe-sjnw/assets/scripts/bridge/`
- `games/slot-fe-xltb2/assets/scripts/bridge/`

---

## ext-module 同步

`slot-game-ext-module/` 打包成 UMD bundle.js，遊戲透過動態載入使用。

### 修改後需要

1. 重新打包 bundle.js
2. 部署新版 bundle 到 CDN 或本地測試環境
3. 各遊戲整合測試（確認 ServiceBridge API 相容）
4. 如有 breaking change，需更新所有遊戲的對應代碼

---

## Template 變更評估

Template 修改**不會自動同步**到現有遊戲。需要判斷：

| 變更類型 | 是否回推 | 說明 |
|---------|---------|------|
| Bug fix（如 Bootstrap 初始化順序） | ✅ 建議回推 | 現有遊戲可能有同樣問題 |
| 新功能（如新的 custom UI 組件） | ⚠️ 視需求 | 現有遊戲不一定需要 |
| 結構調整（如目錄重組） | ❌ 通常不回推 | 成本太高，只影響新遊戲 |

---

## Root Submodule 指向更新

當任何 submodule 內部有新 commit 時，root 的 submodule 指向會變成 dirty。

### 更新特定 submodule

```bash
git add games/slot-fe-mjhl
git commit -m "chore: update slot-fe-mjhl submodule"
```

### 更新所有 submodule 到最新

```bash
git submodule update --remote --merge
git add .
git commit -m "chore: update all submodules"
```

---

## 目錄結構

```
slot-fe-client/                        ← root monorepo
├── slot-game-ext-module/              ← 共用核心模組（submodule）
├── games/
│   ├── slot-game-template/            ← 遊戲模板（submodule）
│   │   └── assets/scripts/bridge/     ← Bridge（submodule）
│   ├── slot-fe-mjhl/                  ← 遊戲（submodule）
│   │   └── assets/scripts/bridge/     ← Bridge（submodule）
│   ├── slot-fe-sjnw/                  ← 遊戲（submodule）
│   │   └── assets/scripts/bridge/     ← Bridge（submodule）
│   └── slot-fe-xltb2/                 ← 遊戲（submodule）
│       └── assets/scripts/bridge/     ← Bridge（submodule）
└── .gitmodules
```

---

## 常用指令

```bash
# 初始 clone（含所有 submodule）
git clone --recursive <repo-url>

# 已 clone 後初始化 submodule
git submodule update --init --recursive

# 查看所有 submodule 狀態（+ 表示有新 commit 未同步）
git submodule status

# 新增遊戲 submodule
git submodule add <repo-url> games/slot-fe-newgame
```
