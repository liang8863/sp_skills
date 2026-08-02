---
name: slot-game-debugging
description: 'Slot 遊戲客戶端與後端資料問題排查流程。用於 spin/cascade/lastSpin、reelLayout/rl、 elimination、長圖標/合併圖標、倍率、轉盤格數、ExternalModules SlotReel 報錯等問題； 特別適用於判斷錯誤源頭在 API、ResponseMapper、GameService、PerformanceCtrl、SlotReel hooks、 prefab/runtime 節點或後端 runner。排查時必須先驗證資料來源與契約，不為非法後端資料做前端兜底。'
---


# Slot Game Debugging

所有回覆使用繁體中文。
确保cocos creator MCP在开启状态

## 核心原則

- 先追資料來源，再改行為。不要看到報錯就先在前端 normalize、filter、補值、改成能跑。
- 非法資料要暴露，不要兜底吞掉。前端只能加診斷、斷言、清晰錯誤訊息；除非使用者明確要求兼容舊資料。
- 先驗證契約：盤面尺寸、column-major/row-major、flat index、長圖標編碼、`-1` 含義、消除索引、事件時序。
- 分清「資料本身非法」和「前端解讀方式錯誤」。同一串 flat layout 可能因列高/行高切分不同而變合法或非法。
- 修復要落在產生錯誤的一層：API 原始響應錯就追後端 runner；mapper 直通就不要怪 mapper；view 顯示錯才改 prefab/hooks。

## 建議排查順序

1. 從最早錯誤堆疊定位入口。
   找到報錯函數、事件名、調用鏈，例如 `LongSymbolCodec.buildGroupsFromLayout -> setSpinResult -> CustomSlotReelMgrView`。

2. 讀最新 runtime log，而不是只看畫面。
   優先查 `temp/logs/project.log`、Cocos Console、MCP logs。抓出報錯前最近一次 `Spin 原始响应`、`Spin 响应`、`CASCADE_RESULT`、`LAST_SPIN_RESTORE`。

3. 對比 raw API 和 mapped model。
   檢查 `GameApi` 的原始 `response.data`，再看 `ResponseMapper` 是否只是直通，例如 `reelLayout: result.rl || []`。
   如果 raw 已非法，前端 mapper 通常不是源頭。

4. 驗證 layout 合約。
   明確列出：
   - `rl` 實際長度
   - 約定列數與行數
   - 每列切片結果
   - `index = col * row + rowIndex` 還是其他規則
   - `-1` 是遮罩格、長圖標 continuation、空格，還是被屏蔽位置

5. 驗證長圖標編碼。
   對 `value >= 100` 的圖標解碼：
   `symbolId = value % 100`
   `size = Math.floor((value % 1000) / 100)`
   `extra = Math.floor(value / 1000)`
   合法規則：head 後面只能跟 `size - 1` 個 `-1`，不能多也不能少；長圖標不能越過列底。

6. 判斷是後端資料錯，還是前端切分錯。
   如果 raw `rl` 長度不符合合約，例如約定 `5x6=30` 但返回 32，先判定後端/API 不一致。
   如果 raw 長度符合，但前端 `splitReelLayout()` 用錯 `getMaxRow()` 或忽略變長列，才改前端切分。

7. 只在確定前端責任後改前端。
   常見前端責任包括：
   - `splitReelLayout` 用固定列高，但實際是變列高
   - `splitEliminationByReel` flat index 轉換規則與後端不一致
   - `normalizeLayoutsForLongSymbolCodec` 把屏蔽格和 continuation 混為一談
   - hooks 中 symbol node/animation node 對位錯
   - prefab mask/viewport 尺寸與 runtime 邏輯不一致

8. 如果是後端責任，指出具體後端位置。
   優先搜 `server/slot-be-runner-*`、`GameInfo`、`Col`、`Row`、`DefaultLayout`、`Fill`、`Fall`、`DetectAwards`、`reEncodeMasks`、`EncodeMask`。
   給出證據：原始 API 響應、runner 配置、生成函數、與契約不一致的地方。

## 疑難問題定位規則

- 遇到難以直接判斷根因的問題時，允許先加最小範圍的診斷 log，再透過 MCP、瀏覽器預覽、復現腳本或固定 spin/lastSpin 資料重現問題，用 runtime 證據定位具體層級。
- 診斷 log 要圍繞關鍵輸入、狀態轉換、事件順序、節點/組件引用、資源 UUID、layout 切片結果等資訊；避免大面積刷屏、泄露 token/帳號資料，修復後刪除或降級為 debug。
- 復現時要記錄入口、操作步驟、觸發資料、預期/實際、console/MCP/project.log 證據；先復現並確認問題，再修改 API/mapper/service/hooks/prefab/runtime 中真正出錯的那一層。

## 禁止模式

- 不要用 `-1 -> 普通圖標`、`slice(0, 30)`、`filter(Boolean)`、隨機補圖標等方式讓前端先跑起來。
- 不要把「後端返回非法資料」描述成「前端兼容性問題」。
- 不要只看 prefab 或 runtime 節點就判定資料對錯；必須先看 API/layout。
- 不要在未確認 raw response 前修改 `ResponseMapper`、`PerformanceCtrl` 或 hooks。

## 可接受的臨時診斷

- 增加 `validateReelLayout(source, rawLayout)`，在 `setSpinResult/startDropShow` 前打印 `source`、`length`、按列切片與非法原因。
- 對非法資料 `throw` 或 `logger.error`，讓問題停在入口處。
- 診斷代碼要清楚標明是 validator，不要自動改資料。

## 典型證據格式

```text
結論：來源在 API 原始響應，不在前端 mapper。
證據：
- GameApi Spin 原始响应 rl length = 32，合約應為 5x6=30。
- ResponseMapper 只做 reelLayout: result.rl || []。
- PerformanceCtrl splitReelLayout 之後第 4 列為 [202,-1,-1,7,0,205]。
- LongSymbolCodec 規則中 202 表示 size=2，只允許 1 個 continuation；第 2 個 -1 非法。
下一步：修後端 runner 的 Row/DefaultLayout/長圖標 reEncode 規則，不在前端兜底。
```
