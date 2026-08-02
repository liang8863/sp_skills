---
name: thpsj-new-game-setup
description: '[games/thpsj] 從模板建立新 Slot 遊戲的完整流程。當建立新遊戲專案、 設置初始配置、搭建遊戲骨架時使用。'
---

> Migrated from $(System.Collections.Hashtable.Src). Original Claude skill name: $origName. Scope: $(System.Collections.Hashtable.Scope).


# 從模板建立新遊戲

> 所有回覆必須使用繁體中文。

---

## 完整步驟（20 步）

### 1. 複製模板

```bash
cp -r slot-game-template slot-fe-mygame
cd slot-fe-mygame
```

> **注意：** `cp -r` 會把 `assets/scripts/bridge/.git` 也複製過來，
> 但該檔案指向的是 template 的 git modules 路徑，在新遊戲中無效。
> 必須執行下一步重新初始化 bridge submodule。

### 1b. 重新初始化 bridge submodule

複製後，立即移除錯誤的 bridge 目錄並執行 `git submodule add`：

```bash
# 在新遊戲根目錄執行
rm -rf assets/scripts/bridge
git submodule add https://github.com/jp-sunshine/slot-fe-bridge.git assets/scripts/bridge
```

完成後確認：
- 根目錄新增了 `.gitmodules`，內容為 bridge submodule 的 URL
- `assets/scripts/bridge/.git` 指向 `games/slot-fe-{mygame}/modules/assets/scripts/bridge`（而非 template）

### 2. 確認必要 Prefab、場景與資源

複製模板後，確認以下 prefab 完整存在（這些是所有遊戲共用的 UI 骨架）：

```
assets/prefabs/
├── Bootstrap.prefab                          # 入口場景
└── ui/
    ├── Dialog.prefab                         # 對話框
    ├── LoadingPanel.prefab                   # 載入畫面
    ├── Toast.prefab                          # 提示訊息
    └── GamePanel/                            # 遊戲主面板
        ├── GamePanel.prefab
        ├── CustomAutoSpinPanelView.prefab    # 自動旋轉面板
        ├── CustomBetPanelView.prefab         # 下注面板
        ├── CustomControlPanelView.prefab     # 控制面板
        ├── CustomInfoBarView.prefab          # 資訊列
        ├── CustomMarqueeBarView.prefab       # 跑馬燈
        ├── CustomMenuPanelView.prefab        # 選單面板
        └── CustomReelsContainerView.prefab   # 轉軸容器
```

**場景目錄**也需一併複製，並將場景檔改名為遊戲專屬名稱：

```
assets/scenes/
└── mygameGame.scene    # 模板為 mjhlGame.scene，需改名為 {mygame}Game.scene
```

改名步驟：
```bash
mv assets/scenes/mjhlGame.scene assets/scenes/mygameGame.scene
mv assets/scenes/mjhlGame.scene.meta assets/scenes/mygameGame.scene.meta
```

> **注意：** `buildConfig_web-mobile.json` 中的 `scenes[0].url` 也需同步更新（見步驟 17）。

**資源目錄**也需一併保留，並替換為遊戲專屬素材：

```
assets/resources/
├── animation/    # Spine/骨骼動畫（轉軸符號動畫、特效）
├── atlas/        # 圖集（背景、主要 UI 元素）
├── image/        # 單張圖片
├── sound/        # 音效（bsfx, ssfx, vsfx, nbgm, fbgm）
├── i18n/         # 語言資料（en.ts, zh.ts）
└── localization/ # 多語言資源
    ├── en/
    │   ├── animation/     # 語言相關動畫
    │   ├── marqueeImage/  # 跑馬燈文字圖
    │   └── sprite/        # 語言相關圖片（logo、按鈕文字等）
    └── zh/
        └── （同 en 結構）
```

> **注意：** 模板中的資源以 `mjhl_` 前綴命名，建立新遊戲後需全部替換為遊戲專屬資源（使用新遊戲的前綴命名）。Prefab 內引用的圖片/動畫路徑也需同步更新。

### 3. 修改遊戲配置

編輯 `assets/scripts/config/GameConfig.ts`：

```typescript
export const GameConfig: IGameConfig = {
  gameId: "MYGAME",
  gameName: "My Slot Game",
  gameVersion: "1.0.0",
  isDev: true,
  externalModulesBaseDomain: "",
  apiBaseUrl: "",
};
```

### 4. 修改 API 類型定義

編輯 `assets/scripts/api/types/` 下的檔案，依遊戲 API 格式調整：

- `Common.ts` — 共用類型（登入、餘額等）
- `SpinApi.ts` — Spin 請求/響應類型（依後端 API 格式定義）
- `index.ts` — 統一導出

### 5. 修改 API 攔截器

編輯 `assets/scripts/api/interceptors/`：

- `RequestMapper.ts` — 請求轉換（camelCase → 後端格式）
- `ResponseMapper.ts` — 響應轉換（後端格式 → camelCase）

### 6. 修改 GameApi

編輯 `assets/scripts/api/GameApi.ts`，實現 spin、lastSpin、login、balance 等方法。

### 7. 修改 GameTypes

編輯 `assets/scripts/types/GameTypes.ts`，定義遊戲特有事件名稱和 Payload 類型。

### 8. 修改 GameService

編輯 `assets/scripts/services/GameService.ts`，根據遊戲需求覆寫 hooks：

```typescript
const hooks: IGameServiceHooks<ISpinResultCamel> = {
  gameCode: "MYGAME",
  isCascade: (result) => !result.isSpinFinished,
  onSpinComplete: async (result) => { /* 遊戲特有邏輯 */ },
};
```

模板默認不覆寫任何 hook，全部走預設行為。

### 9. 新增 ResourcePath

新增 `assets/scripts/data/MygameResourcePath.ts`：

- `SYMBOL_TYPES` 枚舉（後端符號代碼）
- `resourcePath` 靜態物件（圖集路徑、音效 key、動畫名稱）
- `getIconAndBgIndex()` 函式（後端代碼 → 前端圖標索引映射）
- `isWildSymbol()` / `isScatterSymbol()` 判斷函式

**建立完成後，刪除模板骨架文件：**
```bash
rm assets/scripts/data/TemplateResourcePath.ts
rm assets/scripts/data/TemplateResourcePath.ts.meta
```

### 10. 新增 SlotReel Hooks

新增 `assets/scripts/custom/GamePanel/` 下：

- `MygameSlotReelHooks.ts` — 單軸 hooks（圖標映射、隨機圖標、停輪動畫）
- `MygameSlotReelMgrHooks.ts` — 管理器 hooks（Scatter 計數、瞇牌動畫）

### 11. 修改 Bootstrap

編輯 `assets/scripts/Bootstrap.ts`：

- 啟用 SlotReel 初始化（`initSlotReelLogic()`）
- import 遊戲專屬的 hooks
- 綁定自定義服務到 Container

### 12. 修改 CustomSlotReelMgrView

編輯 `assets/scripts/custom/GamePanel/CustomSlotReelMgrView.ts`：

- 設定 `scatterID`（Scatter 符號的後端代碼）
- 設定轉軸相關參數

### 13. 新增 PerformanceCtrl（表演控制器）

新增 `assets/scripts/ui/MygamePerformanceCtrl.ts`：

- 管理各種動畫表演流程（Big Win、特殊模式進入等）
- 監聽 GameService 事件並觸發對應表演

### 14. 新增 OddsDisplay（賠率顯示面板）

新增 `assets/scripts/ui/MygameOddsDisplay.ts`（已從模板複製為 `TemplateOddsDisplay.ts`）：

**前綴替換：**
- 全域替換 `Template` → `{PascalCase 前綴}`（如 `Mygame`）
- 全域替換 `template` → `{小寫前綴}`（如 `mygame`）
- ccclass 名稱同步更新

**填寫遊戲特定常數（空陣列 → 實際值）：**
- `WILD_CODE` — Wild 的後端代碼
- `CLUSTER_BANDS` — 集群檔位標籤（從高到低）
- `PAY_GROUPS` — 各賠付組的倍率（行數須與 CLUSTER_BANDS 一致）
- `ICON_TO_PAY_GROUP` — 前端圖標索引 → 賠付組索引的映射

**整合 PerformanceCtrl：**
- import `MygameOddsDisplay`
- 加入 `@property({ type: MygameOddsDisplay }) private oddsPanel`
- `onSpinStart` → `this.oddsPanel?.reset()`
- `onSpinResult` / `onLastSpinRestore` → `this.oddsPanel?.setResult(reelLayout2D)`

**Prefab 綁定（在 Cocos Editor 中，或透過 JSON 修改）：**
在 `CustomReelsContainerView.prefab` 的 OddsPanel 節點上掛載組件，
屬性對應表：

| 屬性 | 綁定目標 |
|------|---------|
| mask | OddsPanel/mask |
| multiplierLabelL | L/oddDisplayNode/.../multiplierLabel (Label) |
| oddsLabelL | L/oddDisplayNode/.../oddsLabel (Label) |
| wildNodeL | L/wildNode |
| scatterNodeL | L/scatterNode |
| symbolL | L/oddDisplayNode/symbol (CustomSlotReelSymbolView) |
| oddDisplayNodeL | L/oddDisplayNode |
| R 側同理 | |
| btnGroup | btnPanel |
| wildSpineList | wildNodeL, wildNodeR 下的 Spine 組件 |

> 若 OddsPanel 節點尚未在 Cocos Editor 中建立，需先手動建立節點結構
>（mask、btnPanel、oddDisplayNodeL/R、wildNodeL/R、scatterNodeL/R），
> 再執行綁定。

**建立完成後，刪除模板骨架文件：**
```bash
rm assets/scripts/ui/TemplateOddsDisplay.ts
rm assets/scripts/ui/TemplateOddsDisplay.ts.meta
```

### 15. 新增 BigWinShow（大獎表演）

**確認依賴組件：**

1. `assets/scripts/custom/Common/CustomRunCoinLabelView.ts` 應已從模板複製，無需修改（通用組件）。
2. `bridge/types/uiCocos/Common/index.ts` 需包含 `IRunCoinLabelView`、`RunCoinLabelLogic`、`RunCoinLabelConfig` 的 export。
   若缺少，從模板的同路徑檔案補上。

**新增 `assets/scripts/ui/MygameBigWinShow.ts`**（已從模板複製為 `TemplateBigWinShow.ts`）：

**前綴替換：**
- 全域替換 `Template` → `{PascalCase 前綴}`（如 `Mygame`）
- ccclass 名稱同步更新

**實作 `playBigWinEffect(level)` 方法：**
模板中為空方法 + 註解範例，需根據遊戲的 Spine 特效資源實作。
參考 MJHL：在 ResourcePath 中定義 `bigWinBeginAni` / `bigWinIdleAni` 動畫名稱，
在方法中播放大獎文字 Spine、金幣特效 Spine 等。

如需新增 Spine 特效的 @property，自行在類中加入（模板不預設）。

**可調整的常數：**
- `bigWinShowTime` — 每階段表演時間（預設 3 秒）
- `stayShowTime` — 結束後停留時間（預設 2 秒）

**整合 PerformanceCtrl：**
- import `MygameBigWinShow`
- 加入 `@property({ type: MygameBigWinShow }) private bigWinShow: MygameBigWinShow`
- 新增 `checkBigWin(spinWinAmount, multi)` 方法：

  ```typescript
  // TODO: 根据游戏规格调整倍率门槛
  private readonly BIG_WIN_THRESHOLDS = [5, 15, 35]; // BigWin / MegaWin / SuperMegaWin

  private checkBigWin(spinWinAmount: number, multi: number): void {
      let bigWinLevel = -1;
      for (let i = this.BIG_WIN_THRESHOLDS.length - 1; i >= 0; i--) {
          if (multi >= this.BIG_WIN_THRESHOLDS[i]) {
              bigWinLevel = i;
              break;
          }
      }
      if (bigWinLevel >= 0) {
          this.bigWinShow.startBigWinShow(spinWinAmount, bigWinLevel, () => {
              // 大奖表演结束后回调
              this.sendAnimationComplete();
          });
      } else {
          this.sendAnimationComplete();
      }
  }
  ```
- 在 `onSpinComplete` 或適當的結算時機呼叫 `this.checkBigWin(winAmount, multi)`

**從模板複製 Prefab 並更新 UUID：**

1. 從模板複製 prefab 到新遊戲：
   ```bash
   cp slot-game-template/assets/prefabs/ui/GamePanel/bigwinPanel.prefab \
      slot-fe-mygame/assets/prefabs/ui/GamePanel/bigwinPanel.prefab
   ```

2. Prefab 內引用了模板的 script UUID（壓縮格式），需替換為新遊戲的 UUID。
   使用以下 Node.js 腳本將 UUID 轉為 Cocos 壓縮格式：

   ```bash
   node -e "
   const HexMap = {};
   for (let i = 0; i < 16; i++) HexMap[i.toString(16)] = i;
   function compressUuid(uuid) {
     const hex = uuid.replace(/-/g, '');
     let str = hex.substr(0, 5);
     const bytes = [];
     for (let i = 5; i < 32; i += 2) {
       if (i + 1 < 32) bytes.push((HexMap[hex[i]] << 4) | HexMap[hex[i + 1]]);
       else bytes.push(HexMap[hex[i]] << 4);
     }
     str += Buffer.from(bytes).toString('base64').replace(/=/g, '').substr(0, 18);
     return str;
   }
   // 将下方 UUID 替换为新游戏 .ts.meta 中的实际值
   console.log('BigWinShow:', compressUuid('新游戏-BigWinShow.ts.meta-的-uuid'));
   console.log('RunCoinLabel:', compressUuid('新游戏-CustomRunCoinLabelView.ts.meta-的-uuid'));
   "
   ```

3. 在 `bigwinPanel.prefab` JSON 中替換兩處 `__type__`：

   | 模板壓縮 UUID | 對應組件 | 替換為 |
   |-------------|---------|--------|
   | `017dfJ9K09AUJzX2G2HEa+c` | TemplateBigWinShow | 新遊戲 MygameBigWinShow 的壓縮 UUID |
   | `dcbdevWNvNIOKVGvV0pgCB6` | CustomRunCoinLabelView | 新遊戲 CustomRunCoinLabelView 的壓縮 UUID |

4. 同時將 BigWinShow 組件的 `runCoinLabel` 從 `null` 改為指向
   payoutLabel 上的 CustomRunCoinLabelView（通常是 `{"__id__": 13}`，
   可在 JSON 中搜尋 CustomRunCoinLabelView 的 `__type__` 確認其索引）。

**Prefab 節點結構（供參考）：**

| 節點名稱 | 組件 | 說明 |
|---------|------|------|
| bigwinPanel（根） | UITransform(1080x1920) + MygameBigWinShow + BlockInputEvents | 預設 inactive |
| ├── SpriteSplash | Sprite（黑色半透明遮罩） | 全屏背景 |
| ├── payoutLabel | Label(BitmapFont) + CustomRunCoinLabelView | 跑分數字 |
| └── skipBtn | Button（全屏） | 跳過按鈕 |

> Spine 特效節點（背景、金幣、大獎文字等）依遊戲美術資源自行新增，
> 並在 `MygameBigWinShow` 中加入對應的 `@property` 和 `playBigWinEffect()` 實作。

**在 Cocos Editor 中完成的工作：**
- 確認 BitmapFont 和 SpriteFrame 資源引用正確（模板的 UUID 可能需替換為遊戲專屬資源）
- 在 PerformanceCtrl 所掛載的節點中，將 bigwinPanel prefab 實例的
  MygameBigWinShow 組件拖入 `bigWinShow` 屬性

**建立完成後，刪除模板骨架文件：**
```bash
rm assets/scripts/ui/TemplateBigWinShow.ts
rm assets/scripts/ui/TemplateBigWinShow.ts.meta
```

### 16. 複製開發工具配置

從 template 複製以下檔案到新遊戲根目錄：

- `.eslintrc.js`（ESLint 配置，含 Cocos globals）
- `.prettierrc.js`（Prettier 統一配置）
- `.gitignore`（Cocos 專案標準忽略清單）
- `package.json`（含 eslint/prettier 依賴）

然後執行 `npm install` 安裝依賴。

### 17. CI/CD 配置

從模板複製以下 CI/CD 檔案到新遊戲根目錄，並修改遊戲特有的值：

#### `.github/workflows/build-and-deploy.yml`

從模板複製，修改兩個 `env` 變數：

```yaml
env:
  GAME_NAME: "slot-fe-mygame"       # 修改為新遊戲的 repo 名稱
  GAME_SHORT_NAME: "mygame"         # 修改為新遊戲的縮寫（用於 GCS 路径）
```

#### `engine-mangle-config.json`

直接從模板複製，無需修改（通用 Cocos 引擎混淆配置）。

#### `buildConfig_web-mobile.json`

從模板複製，修改以下欄位：

```json
{
  "name": "slot_mygame",
  "scenes": [
    {
      "url": "db://assets/scenes/mygameGame.scene",
      "uuid": "ce9cfff9-a3e9-4615-ba35-49008bafe45e"
    }
  ]
}
```

- `name`：改為 `slot_{遊戲縮寫}`
- `scenes[0].url`：改為對應遊戲場景檔名（需與 `assets/scenes/` 下的 `.scene` 檔案一致）
- `uuid` 和 `startScene` 保持不變（所有遊戲共用同一場景 UUID）

> **前置條件：** `buildConfig_web-mobile.json` 依賴場景檔案存在。若遊戲尚無 `assets/scenes/` 目錄和場景檔，需先在 Cocos Editor 中建立場景後再配置此檔案。

#### GitHub Secrets / Variables

CI 正常運行需要在遊戲 repo 的 GitHub Settings 中配置：

- **Secrets：** `TOKEN`（用於存取私有 submodule 和下載 Cocos Creator）
- **Variables：** `WIF_PROVIDER`、`SERVICE_ACCOUNT`（用於 GCP 認證和 GCS 上傳）

### 18. 建立遊戲 AGENTS.md

在遊戲根目錄建立或更新 `AGENTS.md`，參考現有遊戲格式：

```markdown
# MYGAME（遊戲中文名）

> **所有回覆必須使用繁體中文。**

## 定位
基於 slot-game-template 的實際 Slot 遊戲實現。

## 技術棧
Cocos Creator 3.8 + TypeScript

## 遊戲 ID
MYGAME

## 遊戲規格
- N 軸 × N 行
- API 格式說明

## 專屬功能
- （列出遊戲特有機制）

## 目錄結構
（同 template 結構，加上遊戲特有目錄）
```

### 19. 建立遊戲專屬 Skill

建立 `.codex/skills/<game>-game-logic/SKILL.md`：

```yaml
---
name: <game>-game-logic
description: >
  <遊戲名稱> 的專屬遊戲邏輯。處理 Cascade 連消、<特殊機制>、
  <遊戲名稱> 的 API 調用、符號映射時使用。
---
```

內容包含：符號系統表、特殊機制說明、GameService hooks 覆寫、API 結構、專屬事件。
參考現有 `.codex/skills/*-game-logic/SKILL.md` 格式。

> 寫入 SKILL.md 後，可手動執行 `.codex/hooks/update-readme-skills.js` 更新 README 的 Codex 配置段落。

### 20. 註冊 commit/review workflow 參數

在根專案的以下兩個 Codex workflow skill 中，將新遊戲加入參數對照表：

- `.codex/skills/commit-message-workflow/SKILL.md` — 參數對照表新增一行
- `.codex/skills/code-review-workflow/SKILL.md` — 專案對照表新增一行

```markdown
| `mygame` | `games/slot-fe-mygame/` |
```

同時更新 `argument-hint` 中的範例列表。

---

## 設置為 Submodule

```bash
cd slot-fe-mygame
git init
git add .
git commit -m "init: new game from template"
git remote add origin <repo-url>
git push

cd ../..
git submodule add <repo-url> games/slot-fe-mygame
```

---

## 檢查清單

**Prefab 與資源：**
- [ ] 必要 prefab 完整存在（Bootstrap, Dialog, GamePanel, LoadingPanel, Toast, Custom 系列）
- [ ] 場景已從 `mjhlGame.scene` 改名為 `{game}Game.scene`（含 .meta）
- [ ] 資源目錄結構完整（animation, atlas, image, sound, i18n, localization）
- [ ] 模板資源（mjhl_ 前綴）已替換為遊戲專屬資源
- [ ] 模板骨架 TypeScript 文件已刪除（`TemplateResourcePath.ts`、`TemplateOddsDisplay.ts`、`TemplateBigWinShow.ts` 含 .meta）

**遊戲邏輯：**
- [ ] gameId 和 gameName 已修改
- [ ] externalModulesBaseDomain 和 apiBaseUrl 已設定
- [ ] API types（Common.ts, SpinApi.ts）已根據後端格式定義
- [ ] API interceptors（RequestMapper, ResponseMapper）已實現
- [ ] GameApi 方法已實現
- [ ] GameTypes 事件已定義
- [ ] GameService hooks 已根據需求覆寫
- [ ] ResourcePath 符號映射已建立
- [ ] SlotReel Hooks 已建立
- [ ] Bootstrap 已啟用 SlotReel 並 import hooks
- [ ] CustomSlotReelMgrView scatterID 已設定
- [ ] PerformanceCtrl 表演控制器已建立
- [ ] OddsDisplay 賠率面板已建立，常數已填寫
- [ ] OddsDisplay 已整合到 PerformanceCtrl
- [ ] OddsDisplay 已在 Prefab 中綁定
- [ ] BigWinShow 大獎表演已建立，常數已填寫
- [ ] BigWinShow 已整合到 PerformanceCtrl（含 checkBigWin）
- [ ] bigwinPanel.prefab 已建立並綁定
- [ ] 音頻配置已設定
- [ ] i18n 翻譯檔已準備

**開發工具與文檔：**
- [ ] `.eslintrc.js` / `.prettierrc.js` / `.gitignore` 已複製
- [ ] `package.json` 已複製並執行 `npm install`
- [ ] 遊戲 `AGENTS.md` 已建立或更新
- [ ] 遊戲 `.codex/skills/<game>-game-logic/SKILL.md` 已建立
- [ ] `commit-message-workflow` 和 `code-review-workflow` 參數對照表已新增該遊戲
- [ ] bridge submodule 已重新初始化（`rm -rf bridge` + `git submodule add`，非直接複製）
- [ ] 已設置為 Git submodule（monorepo 層）

**CI/CD：**
- [ ] `.github/workflows/build-and-deploy.yml` 已複製並修改 `GAME_NAME` / `GAME_SHORT_NAME`
- [ ] `engine-mangle-config.json` 已複製
- [ ] `buildConfig_web-mobile.json` 已複製並修改 `name` 和 `scenes[0].url`
- [ ] GitHub Secrets（`TOKEN`）和 Variables（`WIF_PROVIDER`、`SERVICE_ACCOUNT`）已配置
