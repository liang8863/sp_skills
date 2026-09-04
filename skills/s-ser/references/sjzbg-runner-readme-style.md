# slot-be-runner-sjzbg
SJZBG Ways Slot

> 5 欄 × 6 行 padded 盤面、對外 4/6/6/6/4 compact layout 的 Ways 遊戲（3456 路）。特色：**3 個奪寶獎勵 3 倍總投注並觸發 10 次 FG**、**長圖標整段掉落**、**延遲派彩**，以及 FG 倍率跨 spin 累積。

---

## 需求文档

- [Museum Wonders 游戏说明（中文）](https://www.pgsoft.com/uploads/Games/Pdf/Museum_Wonders_Gameinformation_ZH.pdf)

## 核心機制

### 5x6 padded 與 26 格 compact

服務端內部使用 5 欄 × 6 行的 padded layout，對外 response 只輸出 26 個有效位置：

- 可見列高：`[4, 6, 6, 6, 4]`
- padded skip indexes：`[0, 5, 24, 29]`
- `rl`、`ptbr`、`snwm[*].pos` 統一使用 compact index `0-25`
- `bet_ways = 4 * 6 * 6 * 6 * 4 = 3456`
- runner 內部下注基數為 `60`，`Results()` 對外仍輸出 `bet_ways = 3456`；單注為 `BetSize * BetLevel`

內部每個 column 的有效範圍如下：

```text
        Col0   Col1   Col2   Col3   Col4
        ----   ----   ----   ----   ----
Row 0:  [██]   [  ]   [  ]   [  ]   [██]
Row 1:  [  ]   [  ]   [  ]   [  ]   [  ]
Row 2:  [  ]   [  ]   [  ]   [  ]   [  ]
Row 3:  [  ]   [  ]   [  ]   [  ]   [  ]
Row 4:  [  ]   [  ]   [  ]   [  ]   [  ]
Row 5:  [██]   [  ]   [  ]   [  ]   [██]
```

`Results()` 才會將 padded layout 投影成 compact layout；runtime、錢包與掉落邏輯仍使用 padded index。

### 長圖標

普通符號與 Wild 可在中間三軸補位時合併為長度 2 的 block，長度編碼使用百位偏移：

```text
value = multiplier * 1000 + (span - 1) * 100 + symbolId
```

例如 `100` 是 Wild 佔兩格，`107` 是 ID `7`（A）佔兩格，`111` 是 ID `11`（10）佔兩格；長圖標尾格在對外 `rl` 中輸出 `-1`。

- 長圖標不得跨欄，也不得覆蓋 padded skip index。
- `Fall()` 將長圖標當作一個 segment 移動，`Fill()` 不會把尾格當作新補位空格。
- 命中後的長圖標 anchor 會記錄在 `retainedLongAnchors`，避免下一個 cascade 重複計獎或拆開掉落。

### 倍率與延遲派彩

倍率基底 ID 為 `13`，顯式倍率值使用千位編碼：

| 倍率 | 編碼值 |
|---|---:|
| x2 | `2013` |
| x3 | `3013` |
| x5 | `5013` |

倍率判斷必須使用 `value >= 1000 && value % 100 == 13`，倍率值為 `floor(value / 1000)`。

- `OnLayoutStart()` 將 cascade 期間的 `AimMulti` 固定為 `1`。
- 普通中獎先累積到 `accWin`，最後一幀才追加「spin派彩」獎項。
- FG 會在 `OnSpinEnd()` 掃描盤面上的顯式倍率符號並累積到 `FGAccMult`；BG 每次 spin 重新計算。
- Wild 目前按普通 Wild 參與 Ways，命中後正常消除；`DetectAwardsPost()` 不再自動執行 Wild -> 倍率符號轉換。

---

## Free Game

- **3 個 Scatter（奪寶）** 固定獎勵 **3 倍總投注**，並觸發 **10 次 FG**；每多 1 個 Scatter 增加 2 次 FG（`10 + (n-3)*2`），派彩仍為 3 倍總投注。
- FG 可重複觸發。
- `FGAccMult` 在 FG spin 之間保留，離開 FG 後在下一個 BG spin 歸零。
- 購買 FG 的首屏使用同一套 5x6 padded layout，至少放置 3 個 Scatter。
- 購買 FG 透過 `BeForeSpin()` 在 SDK 建立首個 spin 前標記 `IsFree`，避免首屏被序列化為 BG。

---

## 符號表

| 常數 | ID | 名稱 | 3連 / 4連 / 5連 |
|---|---:|---|---:|
| `SymbolWild` | 0 | 百搭（萬能） | - |
| `SymbolScatter` | 1 | 奪寶（Free） | 達 3 個：3 倍總投注 |
| `SYMBOL_MONALISA` | 2 | 蒙娜麗莎 | 10 / 15 / 20 |
| `SYMBOL_PAINTING` | 3 | 畫作 | 8 / 10 / 15 |
| `SYMBOL_EYE` | 4 | 眼睛 | 6 / 8 / 10 |
| `SYMBOL_SUNDIAL` | 5 | 日晷 | 5 / 6 / 8 |
| `SYMBOL_VASE` | 6 | 花瓶 | 5 / 6 / 8 |
| `SYMBOL_A` | 7 | A | 3 / 5 / 6 |
| `SYMBOL_K` | 8 | K | 2 / 3 / 5 |
| `SYMBOL_Q` | 9 | Q | 2 / 3 / 5 |
| `SYMBOL_J` | 10 | J | 1 / 2 / 4 |
| `SYMBOL_10` | 11 | 10 | 1 / 2 / 4 |
| `SYMBOL_9` | 12 | 9 | 1 / 2 / 4 |
| `SYMBOL_MULTI` | 13 | 倍率基底 | -（不自然生成） |

> 最低中獎長度 `MinLength = 3`，內部下注基數為 `60`、協議 Ways 為 `3456`，最高贏獎 **5000x**。

---

## Layout 結構

內部 layout 為 5 欄 × 6 行、column-major，`index = col * 6 + row`。對外 compact index 按以下順序排列：

| Col | 有效行數 | compact index | padded index |
|---:|---:|---:|---:|
| 0 | 4 | 0-3 | 1-4 |
| 1 | 6 | 4-9 | 6-11 |
| 2 | 6 | 10-15 | 12-17 |
| 3 | 6 | 16-21 | 18-23 |
| 4 | 4 | 22-25 | 25-28 |

```text
padded:  [0] [1] [2] [3] [4] [5]
Col 0:   [ ] [x] [x] [x] [x] [ ]
Col 1-3: [x] [x] [x] [x] [x] [x]
Col 4:   [ ] [x] [x] [x] [x] [ ]
```

WAYS 計算：`4 × 6 × 6 × 6 × 4 = 3456`。

---

## Detail 欄位

每個 layout 的 `d` 欄位包含 `SjzbgDetail`：

| JSON Key | 型別 | 說明 |
|---|---|---|
| `aw` | decimal | 當前 spin 累積的基礎贏獎金額，最後一幀用於延遲派彩 |
| `eb` | map | 當前 frame 的長圖標 block |
| `ebb` | map | 前一 frame 仍存活的長圖標 block |

長圖標 block 欄位：

| JSON Key | 型別 | 說明 |
|---|---|---|
| `fp` | number | compact 首位置 |
| `lp` | number | compact 尾位置 |
| `bt` | number | block 類型，目前 `1` 為普通或 Wild 長圖標 |
| `ls` | number | 佔用格數，目前長度 2 為 `2` |

```json
{
  "aw": "1.2",
  "eb": {
    "10": { "fp": 10, "lp": 11, "bt": 1, "ls": 2 }
  },
  "ebb": {}
}
```

`eb` 與 `ebb` 使用 compact anchor key；服務端會排除上一 frame 已被消除的 block，避免前端重播失效的長圖標。

---

## SDK 重寫函數

以下函數覆寫了 `BaseGame` / `BaseGameForWays` 的預設實現：

| 函數 | SDK 預設行為 | 重寫差異 |
|---|---|---|
| `BeForeSpin()` | 空實現 | 購買 FG 時在建立首個 spin 前設定 `IsFree` |
| `OnSpinStart()` | 空實現 | 重置 `accWin` 與長圖標保留狀態；BG 歸零 `FGAccMult` |
| `OnLayoutStart()` | 空實現 | 將 cascade 期間 `AimMulti` 固定為 `1` |
| `RandomSymbol()` | panic（必須實現） | 依列權重產出 Wild、Scatter 和普通符號；倍率基底不自然生成 |
| `Fall()` | 一般單格下落 | 以 segment 移動長圖標，並更新保留 anchor |
| `Fill()` | 一般補位 | 跳過長圖標尾格；只在中間三軸依機率將新補入的普通符號或 Wild 建立長度 2 block |
| `DetectAwards()` | Ways 中獎檢測 | 長圖標作為單一 Ways 命中，命中的長格長度以加法累積到 `AimMulti`，再累積 `accWin` |
| `Eliminate()` | 消除所有中獎符號 | Scatter 與倍率符號不消除；Wild 正常消除；長圖標整段保留並防止重複計獎 |
| `DetectAwardsPost()` | 空實現 | 保留 Wild 原始值，不執行自動倍率轉換 |
| `GetSpinChance()` | 依 Scatter 數量增加 FG | 復用 SDK 的 FG 次數後，將新 Scatter 獎項補為 3 倍總投注並同步本局累計 |
| `OnSpinEnd()` | 空實現 | FG 掃描顯式倍率符號並累加 `FGAccMult` |
| `BeforeCurrentLayoutArchive()` | 空實現 | 寫入 `SjzbgDetail`，並在最後一幀追加延遲派彩獎項 |
| `Results()` | 返回 runtime response | padded 投影為 compact，並直接使用精確獎項金額對齊 runtime/response |

---

## 修復說明

本版本針對舊版 5x5/19 格協議與 cascade 狀態錯誤完成以下修復：

1. **盤面協議統一**：由舊 5x5/19 格改為 5x6 padded + 26 格 compact，`bet_ways` 修正為 `3456`，所有對外位置統一使用 compact index。
2. **十進制編碼修正**：倍率改用 `multiplier*1000 + (span-1)*100 + symbolId`，避免 `2013/3013/5013` 被誤判為 Scatter，並支援長圖標與倍率共存。
3. **Wild 消除邏輯修正**：Wild 參與普通 Ways 後正常消除；移除 `DetectAwardsPost()` 中不符合現行協議的 Wild 自動轉倍率行為。
4. **長圖標 cascade 修正**：長圖標按完整 segment 掉落，尾格不再被當作補位空格；保留 anchor 並排除已保留 block 的重複計獎。
5. **`eb/ebb` 狀態修正**：`eb` 僅輸出當前 frame，`ebb` 僅輸出前一 frame 尚存活的 block，並清除已被獎項消除的歷史 block。
6. **派彩資料修正**：長圖標倍率按命中 block 長度相加（例如 `2、4、6`），`BetSize * BetLevel * symbol 倍率 * hitWays * 長格倍率` 保持精確金額，延遲派彩納入 RTP、獎池與 5000x 封頂。
7. **購買 FG 修正**：購買首屏改用 5x6 padded layout，並在 SDK 建立首個 spin 前標記 Free Game，避免 `fr=false` 的錯誤 response。
8. **奪寶派彩修正**：3 個以上 Scatter 的觸發獎項固定派發 `BetAmount * 3`，並保留原有 10 次 FG 與額外 Scatter 增加次數規則。
