---
name: prefab-ui-builder
description: 'Prefab UI 建置工作流。當用戶要求在 prefab 中新增或修改 UI（節點、組件、圖片、按鈕等）時使用。 涵蓋需求分析、模板查找/建構、一次性腳本生成、執行驗證、模板沉澱的完整流程。 此 skill 會自我成長——每次處理新組件類型，都會將模板沉澱到 builtin_templates.py。'
---


# Prefab UI 建置工作流

> 所有回覆必須使用繁體中文。

---

## 工作流程總覽

```
用戶需求（自然語言描述 UI）
    ↓
① 需求分析 — 拆解成節點 + 組件清單
    ↓
② 模板準備 — 每個組件確認有模板可用
    ↓
③ 腳本生成 — 寫入 tools/oneoff/
    ↓
④ 執行驗證 — run → verify() → 確認結構
    ↓
⑤ 模板沉澱 — 新模板寫入 builtin_templates.py，更新 skill 文件
    ↓
⑥ 清理確認 — 詢問用戶是否刪除一次性腳本
```

---

## ① 需求分析

將用戶描述拆解為具體的節點與組件清單。

**需要向用戶確認的資訊：**

| 類別 | 問什麼 | 範例 |
|------|--------|------|
| 節點結構 | 需要幾個節點？父子關係？ | DragonInfoNode > MaskButton |
| 視覺呈現 | 顯示圖片？文字？動畫？ | 靜態圖片（cc.Sprite） |
| 多語言 | 需要切換語言嗎？ | 是 → LocalizedSprite |
| 互動行為 | 可點擊？拖拽？ | 點擊關閉 → cc.Button |
| 觸摸穿透 | 要擋住背後的觸摸嗎？ | 是 → cc.BlockInputEvents |
| 資源 | 圖片 UUID？或圖片檔名讓我查？ | `xltb2_icon_fginfo` |
| 尺寸 / 位置 | 大小？錨點？座標？ | 全螢幕 1080×1920 |

> **原則：問到能產出腳本為止，不多問。** 能從 prefab 現有結構推斷的就不問。

---

## Prefab 建置規則

1. 優先把 View 層 `Component` 之間的依賴落在 prefab 結構與 `@property` 綁定上；建立或修改 UI 時，同步完成 prefab 內的引用關聯。
2. 避免為了方便而在 runtime 動態載入/建立 prefab。能預掛的子 prefab，直接放到引用方 prefab 底下，需要時切 active 或呼叫其 ViewComponent。
3. 新增 holder、mask、controller runtime、effect player 等節點時，優先作為引用方 prefab 的子節點或子 prefab，不要依賴場景啟動時再建立。
4. prefab 自己消費的資料與配置，盡量存在 prefab 或子 prefab；不要寫到 scene 層，除非它是真正的 scene 級配置。多分枝開發時，scene 檔更容易衝突。
5. 任何 UI / 資源 / 節點修改都優先保存到 prefab。若判斷必須修改 `.scene`，先停下來向用戶確認原因、目標 scene 檔與預期改動；未確認前不得寫入 scene。

---

## ② 模板準備

對每個需要的組件，依序嘗試三種來源：

### 來源 A：現有模板（最快）

檢查 `tools/builtin_templates.py` 是否已有對應工廠函數。

```python
# 目前可用的模板
from builtin_templates import sprite        # cc.Sprite
from builtin_templates import button        # cc.Button
from builtin_templates import block_input_events  # cc.BlockInputEvents
```

### 來源 B：Cocos 知識推導（無需範本）

根據 Cocos Creator 組件 API 知識 + 用戶需求，直接構建模板。

**判斷依據：**
- 了解該組件的完整欄位結構（如 cc.ProgressBar、cc.Layout、cc.ScrollView）
- 知道哪些欄位是固定值、哪些需要參數化
- 能確認欄位預設值

**構建步驟：**
1. 列出組件所有欄位與預設值
2. 識別需要參數化的欄位（用戶會想自訂的）
3. 寫成工廠函數，固定值寫死、可變值作參數

### 來源 C：從 Prefab 參考實例（需要現有範本）

從 prefab JSON 中找到同類型組件，提取完整結構。

```python
# 用 CocosJsonEditor 查找
prefab = CocosJsonEditor(PREFAB)
results = prefab.find(lambda i, e: e.get("__type__") == "cc.ProgressBar")
# 讀取完整條目作為模板參考
```

### 來源 D：詢問 + 研究（完全陌生）

1. 詢問用戶需要什麼效果
2. 查閱 Cocos Creator 文件或搜尋組件 API
3. 從需求推導出欄位結構
4. 構建模板

> **優先順序：A → B → C → D**，但不被任何一種卡住。

---

## ③ 腳本生成

一次性腳本統一放 `tools/oneoff/`，命名格式：`<動作>_<目標節點>.py`

```python
# tools/oneoff/mount_dragon_info_components.py
import sys, os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from cocos_prefab_utils import CocosJsonEditor
from builtin_templates import sprite, button

prefab = CocosJsonEditor("games/slot-fe-xltb2/assets/prefabs/ui/GamePanel/GamePanel.prefab")

# 操作邏輯...

prefab.verify()
prefab.save()
```

**標準操作順序：**

```
add_node()          → 建立節點
mount_builtin()     → 掛載內建組件（用模板）
data.append()       → 手動新增資料物件
_rebuild_index()    → 重建索引
mount_component()   → 掛載自定義組件
verify() + save()   → 驗證 + 儲存
```

---

## ④ 執行驗證

```bash
cd /c/Work/Project/slot-fe-client
python tools/oneoff/<script>.py
```

**驗證清單：**
- verify() 通過（所有 `__id__` 引用有效）
- 目標節點的 `_components` 數量正確
- 每個組件的 `__type__` 正確
- 資源 UUID 正確指向預期檔案

---

## ⑤ 模板沉澱

**判斷是否沉澱：** 這次新建的組件結構是否有機會被其他 UI 任務重用？

| 情境 | 動作 |
|------|------|
| 通用內建組件（cc.ProgressBar 等） | 加入 `builtin_templates.py` |
| 專案特有但可能重用的組合 | 加入 `builtin_templates.py` 並備註適用場景 |
| 純粹一次性、極度特殊 | 不沉澱，留在 oneoff 腳本供參考 |

**沉澱步驟：**
1. 在 `tools/builtin_templates.py` 新增工廠函數
2. 更新 `prefab-scene-json` skill 的模板清單表
3. 本 skill 文件的「目前可用模板」清單同步更新

---

## ⑥ 清理確認

所有操作完成且用戶確認結果正確後：

1. **主動詢問：**「一次性腳本已完成任務，是否要刪除 `tools/oneoff/` 下的腳本？」
2. 用戶同意 → 刪除對應腳本
3. 用戶拒絕 → 保留（可能想留著做參考或需要回頭檢查）

---

## 目前可用模板一覽

| 工廠函數 | 組件 | 參數 |
|---------|------|------|
| `sprite(uuid, size_mode)` | cc.Sprite | uuid: spriteFrame UUID；size_mode: 0/1/2 |
| `button(transition, interactable)` | cc.Button | transition: 0~3；interactable: bool |
| `block_input_events()` | cc.BlockInputEvents | 無 |

> 此表隨每次 UI 任務新增模板而成長。

---

## 決策速查

```
用戶說…                    → 我判斷…
「加一個節點」              → add_node()
「要顯示圖片」              → mount_builtin(sprite(...))
「圖片要多語言切換」         → data.append(LocalizedSpriteItem) × N + mount_component(LocalizedSprite)
「要能點擊」                → mount_builtin(button(...))
「擋住後面觸摸」            → mount_builtin(block_input_events())
「要顯示文字」              → mount_builtin 或 mount_component（視 cc.Label / cc.RichText）
「要有進度條」              → 檢查模板 → 沒有就建新的 → 沉澱
「要有捲動區域」            → 同上（cc.ScrollView）
「我也不確定要什麼組件」     → 從需求描述反推，提出建議讓用戶確認
```
