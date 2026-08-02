---
name: prefab-scene-json
description: 'Cocos Creator Prefab/Scene JSON 操作指南與 Python 工具庫。當需要用腳本在 prefab/scene 的 JSON 中新增節點、掛載內建或自定義組件、綁定 @property 引用、建立跨 prefab 引用 （targetOverrides）時使用。涵蓋 CocosJsonEditor API、builtin_templates 模板工廠、 資料物件手動 append 模式，以及完整操作流程。 **當制定計畫或實作中涉及新增/修改 @property 時也須載入，確認 prefab 綁定步驟。**'
---


# Prefab / Scene JSON 操作指南

> 所有回覆必須使用繁體中文。

---

## 核心概念

Cocos Creator 的 `.prefab` 和 `.scene` 文件本質是 **JSON 陣列**，每個元素用 `__id__`（陣列索引）互相引用。

```
[ entry_0, entry_1, entry_2, ... ]
         ↑
  { "node": { "__id__": 1 } }  ← 引用 entry_1
```

## Scene 修改限制

- 優先把 UI、資源、節點、`@property` 綁定與配置保存到 prefab 或子 prefab。
- 不要直接修改 `.scene` 數據，除非它是真正不可避免的 scene 級配置或跨 prefab override。
- 若判斷必須修改 `.scene`，先停下來向用戶確認原因、目標 scene 檔、預期改動與風險；未獲確認前不得寫入 scene。
- 能透過 prefab 結構、子 prefab、prefab 內 `@property` 綁定、或父 prefab `targetOverrides` 解決的，不升級為 scene 修改。

---

## 工具架構

```
tools/
├── cocos_prefab_utils.py    # 永久 — Core（CocosJsonEditor 類）
├── builtin_templates.py     # 永久 — 純 data 工廠（sprite, button, block_input_events）
└── oneoff/                  # 一次性腳本區（完成後可刪除）
    ├── add_xxx_node.py
    └── mount_xxx_components.py
```

**設計原則：Core 提供機制，Templates 提供策略，一次性腳本做組合。**

### 一次性腳本生命週期

```
① 建立腳本 → tools/oneoff/<描述性名稱>.py
② 執行 + verify() 確認正確
③ 如有問題 → 回 oneoff/ 檢查腳本邏輯、修正後重跑
④ 全部確認沒問題 → 主動詢問用戶是否刪除一次性腳本
⑤ 用戶同意 → 刪除 oneoff/ 下的腳本（保留空目錄）
```

> **import 路徑：** oneoff 腳本用 `sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))` 指向上層 `tools/`。

---

## CocosJsonEditor API

```python
from cocos_prefab_utils import CocosJsonEditor

prefab = CocosJsonEditor("games/slot-fe-xltb2/assets/prefabs/ui/GamePanel/GamePanel.prefab")
```

### 查詢方法

| 方法 | 回傳 | 用途 |
|------|------|------|
| `node(name, parent=None)` | `{"__id__": N}` | 按名稱找節點 |
| `component(cc_type, on_node=None, ancestor=None)` | `{"__id__": N}` | 按類型找組件 |
| `asset(uuid, expected_type)` | `{"__uuid__": ..., "__expectedType__": ...}` | 建立資源引用 |
| `find(predicate)` | `[(idx, entry), ...]` | 通用搜索 |
| `entry(idx)` | `dict` | 取得指定索引條目 |
| `dump_node_tree(root_name, max_depth)` | `str` | 輸出節點樹（除錯用） |

### 修改方法

| 方法 | 回傳 | 用途 |
|------|------|------|
| `add_node(name, parent, size, ...)` | `{"__id__": N}` | 新增節點（自動建立 UITransform + PrefabInfo） |
| `mount_component(script_meta, on_node, properties)` | `fileId: str` | 掛載自定義組件（讀 .meta 算 __type__） |
| `mount_builtin(template, on_node)` | `comp_idx: int` | 掛載內建組件（用 builtin_templates 工廠） |
| `add_scene_override(source_meta, property_name, ...)` | — | 建立跨 prefab 引用（含新增屬性到組件） |
| `add_target_override(source, property_name, target, target_file_id)` | — | 建立跨 prefab 引用（僅連結，屬性已存在） |

### 輸出方法

| 方法 | 用途 |
|------|------|
| `verify()` | 驗證所有 `__id__` 引用不越界 |
| `save()` | 寫入 JSON（indent=2 + ensure_ascii=False + 尾部換行） |

---

## builtin_templates 模板工廠

```python
from builtin_templates import sprite, button, block_input_events
```

| 工廠函數 | 參數 | 說明 |
|---------|------|------|
| `sprite(sprite_frame_uuid, size_mode=0)` | uuid: `"xxx@f9941"` 或 None; size_mode: 0=CUSTOM, 1=TRIMMED, 2=RAW | cc.Sprite 模板 |
| `button(transition=0, interactable=True)` | transition: 0=NONE, 1=COLOR, 2=SPRITE, 3=SCALE | cc.Button 模板 |
| `block_input_events()` | 無 | cc.BlockInputEvents 模板（攔截觸摸穿透） |

模板中 `node` 和 `__prefab` 為 None 佔位，由 `mount_builtin()` 自動覆寫。

**新增模板方法：** 在 `builtin_templates.py` 加一個工廠函數即可，Core 不需要修改。

---

## 操作模式分類

### 模式 A：新增節點 — `add_node()`

```python
node_ref = prefab.add_node("MyNode", parent="GamePanel", size=(200, 100))
# 自動建立: cc.Node + cc.UITransform + cc.CompPrefabInfo + cc.PrefabInfo（共 4 條目）
```

### 模式 B：掛載內建組件 — `mount_builtin()`

```python
from builtin_templates import sprite, button

sprite_idx = prefab.mount_builtin(sprite("xxx@f9941"), on_node="MyNode")
btn_idx = prefab.mount_builtin(button(transition=3), on_node="MaskButton")
# 自動建立: 組件 + cc.CompPrefabInfo（共 2 條目），自動更新 _components
```

### 模式 C：掛載自定義組件 — `mount_component()`

```python
file_id = prefab.mount_component(
    script_meta="assets/scripts/bridge/components/i18n/LocalizedSprite.ts.meta",
    on_node="MyNode",
    properties={"spriteList": [{"__id__": item1_idx}, {"__id__": item2_idx}]},
)
# 自動: 讀 .meta UUID → 算 __type__ → 建立組件 + CompPrefabInfo → 更新 _components
```

### 模式 D：手動 append 資料物件

非組件的資料物件（如 `LocalizedSpriteItem`）不掛在 `_components` 上，需手動 append：

```python
item_idx = len(prefab.data)
prefab.data.append({
    "__type__": "LocalizedSpriteItem",
    "language": "en",
    "spriteFrame": {"__uuid__": "xxx@f9941", "__expectedType__": "cc.SpriteFrame"},
})
# 注意：append 後若要用 node()/component() 查詢，需先 prefab._rebuild_index()
```

---

## 標準操作流程

```
① add_node()          → 建立節點結構（cc.Node + UITransform + PrefabInfo）
② mount_builtin()     → 掛載內建組件（cc.Sprite / cc.Button / cc.BlockInputEvents）
③ data.append()       → 手動新增資料物件（LocalizedSpriteItem 等）
④ _rebuild_index()    → 重建索引（手動 append 後必須呼叫）
⑤ mount_component()   → 掛載自定義組件（讀 .meta，可引用 ③ 的資料物件）
⑥ verify() + save()   → 驗證引用 + 寫入磁碟
```

> **順序重要：** 資料物件（③）必須在引用它的自定義組件（⑤）之前建立。

---

## __type__ 編碼算法

腳本組件的 `__type__` 由 script UUID 壓縮而來：

| 步驟 | 說明 | 範例 |
|------|------|------|
| 1 | 去掉 UUID 連字號 | `9098dcc8655f4b9bad1f4505c47ba424` (32 hex) |
| 2 | 前 5 hex 保留 | `9098d` |
| 3 | 剩餘 27 hex → 108 bits → 18 個 base64 字元 | `zIZV9Lm60fRQXEe6Qk` |
| 4 | 拼接 | `9098dzIZV9Lm60fRQXEe6Qk` (23 chars) |

> 內建組件直接用 `"cc.Sprite"` 等字串，不需要壓縮。由 `builtin_templates` 處理。

---

## @property 引用格式

| 引用類型 | JSON 格式 | 範例 |
|---------|----------|------|
| Node 節點 | `{ "__id__": N }` | `"progressNode": { "__id__": 71 }` |
| Component 組件 | `{ "__id__": N }` | `"progressLabel": { "__id__": 143 }` (cc.Label) |
| Asset 資源 | `{ "__uuid__": "...", "__expectedType__": "cc.XXX" }` | SpriteAtlas / SpriteFrame 等 |
| null 值 | `null` | 場景中透過 targetOverrides 解析 |

---

## 跨 Prefab 引用（targetOverrides）

場景組件引用 prefab 內部組件時使用。

```
Scene 組件 [108]                 GamePanel Prefab
┌──────────────────┐             ┌──────────────────┐
│ dragonProgressBar│──── null ──→│ [1688] 組件      │
│   : null         │    (運行時   │   CompPrefabInfo │
└──────────────────┘    由 target │   fileId: "xxx"  │
         ↑              Overrides └──────────────────┘
         │              解析)             ↑
    TargetOverrideInfo                    │
    source: [108]                    TargetInfo
    propertyPath: ["dragonProgressBar"]  localID: ["xxx"]
    target: [5] (prefab 實例根節點)
```

### 方式 A：`add_scene_override`（含新增屬性）

適用於屬性尚未存在於組件中，需要同時新增 `property: null` 並建立 override。

```python
scene.add_scene_override(
    source_meta="assets/scripts/ui/MyCtrl.ts.meta",
    property_name="dragonProgressBar",
    prefab_instance="GamePanel",
    target_file_id="xxx",          # prefab 內 CompPrefabInfo.fileId
    insert_after="payoutPanel",    # 屬性插入位置
)
```

### 方式 B：`add_target_override`（僅連結）

適用於屬性已存在於組件中（Cocos 編譯腳本時自動序列化為 null），只需建立 override 連結。

```python
scene.add_target_override(
    source=74,                     # 來源組件索引或 {"__id__": N}
    property_name="dragonDisplay",
    target=5,                      # prefab 實例根節點（名稱/索引/ref）
    target_file_id="WfOROdW6TqmlKbr0b_MHJg",
)
```

> **注意：** 寫入場景前需確保 Cocos Editor 已儲存場景（無未儲存的變更），否則 Editor 再次儲存時會用記憶體中的舊資料覆蓋腳本寫入的內容。

> **localID 規則：** 直接組件 = 1 層，巢狀 prefab 內組件 = 2 層。

---

## 一次性腳本範例

```python
"""在 GamePanel.prefab 的 DragonInfoNode 掛載 cc.Sprite + LocalizedSprite"""
# 位置：tools/oneoff/mount_dragon_info_components.py
import sys, os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from cocos_prefab_utils import CocosJsonEditor
from builtin_templates import sprite

PREFAB = "games/slot-fe-xltb2/assets/prefabs/ui/GamePanel/GamePanel.prefab"
EN_UUID = "9c0566d7-a2ce-41aa-a0fe-1e8a2ba91f75@f9941"
ZH_UUID = "20572a74-d1e4-4794-98dd-712bdb432414@f9941"

prefab = CocosJsonEditor(PREFAB)
node_ref = prefab.node("DragonInfoNode")

# ② 內建組件
prefab.mount_builtin(sprite(EN_UUID), on_node=node_ref)

# ③ 資料物件
en_idx = len(prefab.data)
prefab.data.append({"__type__": "LocalizedSpriteItem", "language": "en",
                     "spriteFrame": {"__uuid__": EN_UUID, "__expectedType__": "cc.SpriteFrame"}})
zh_idx = len(prefab.data)
prefab.data.append({"__type__": "LocalizedSpriteItem", "language": "zh",
                     "spriteFrame": {"__uuid__": ZH_UUID, "__expectedType__": "cc.SpriteFrame"}})

# ④ + ⑤ 自定義組件
prefab._rebuild_index()
prefab.mount_component(
    script_meta="assets/scripts/bridge/components/i18n/LocalizedSprite.ts.meta",
    on_node=node_ref,
    properties={"spriteList": [{"__id__": en_idx}, {"__id__": zh_idx}]},
)

# ⑥ 驗證 + 儲存
prefab.verify()
prefab.save()
```

---

## 實作計畫規範

當實作涉及 prefab/scene JSON 修改時（特別是 `@property` 綁定），**計畫階段就必須包含 oneoff 腳本步驟**，不得標註為「需手動在 Cocos Editor 操作」。

計畫中應列出：

| 項目 | 說明 | 範例 |
|------|------|------|
| 目標檔案 | 要修改的 prefab/scene | `GamePanel.prefab` |
| source 組件 | `@property` 所在的組件類型 | `Xltb2DragonDisplay` |
| property 名稱 | 新增的屬性 | `earthTransAnim` |
| target 位置 | 要綁定的節點/組件 | `earth_trans...` 上的 `cc.Animation` |
| target fileId | `CompPrefabInfo.fileId` | `RU/vVhtwyZ42Y4tJ3AXmCQ` |
| 引用方式 | 直接 `__id__` 或 `targetOverride` | nested prefab → `targetOverride` |

> **原則：** 代碼能做的事，不留給人手動做。Prefab 綁定是實作的一部分，不是附加步驟。

---

## 樣式資源替換但保留邏輯

當需求是「用資源工程 / `xxx_res` 替換樣式，但不要改功能」時，腳本修改 prefab 必須先保護邏輯綁定，再替換視覺引用。

1. 同時讀取 donor prefab 與 live target prefab，不直接整檔覆蓋 live prefab。
2. 先斷言 live target 的關鍵資訊：
   - prefab `.meta` UUID 不變。
   - 主要腳本組件 `__type__` 不變。
   - 主要腳本組件的 `cc.CompPrefabInfo.fileId` 不變。
   - 父 prefab/scene 的 `targetOverrides.localID` 仍指向同一個 fileId。
   - `@property` 綁定的 Node / Component 引用仍可解析到有效 `__id__`。
3. 建立 donor → target 映射表，只複製確認安全的欄位：
   - `cc.Sprite._spriteFrame`
   - `cc.Sprite._sizeMode`
   - `cc.Sprite._customMaterial`（只在 target project 中存在或已映射時）
   - `cc.UITransform._contentSize`
   - `cc.Node._lpos` / `_lscale`
4. 不要把 donor 的舊 controller 腳本掛到 live target；若 donor controller 有箭頭、hover、狀態圖等資源常量，轉成 live controller 既有 `@property` 資源欄位。
5. 寫入後必須做三類驗證：
   - JSON `__id__` 引用不越界。
   - 所有 `__uuid__` 的 base UUID 都能在 target project 的 `.meta` 中找到。
   - 關鍵 fileId / targetOverride / `@property` 綁定未漂移。

---

## 常見陷阱

| 問題 | 說明 |
|------|------|
| `__type__` hash 錯誤 | 用 `mount_component()` 自動算，不要手動猜 |
| 忘記 CompPrefabInfo | `mount_builtin()` / `mount_component()` 已自動處理 |
| 手動 append 後沒 rebuild | 呼叫 `_rebuild_index()` 後才能用查詢方法 |
| `_id` 欄位 | prefab 內組件用 `""`，場景內組件有實際 ID |
| JSON 格式化 | `save()` 已處理（indent=2 + ensure_ascii=False + 尾部換行） |
| 屬性順序 | 新屬性插在同類屬性之後（`add_scene_override` 的 `insert_after` 參數） |
| localID 層數 | 直接組件 = 1 層，巢狀 prefab 內組件 = 2 層 |
| 整檔覆蓋 live prefab | 樣式替換時容易把 donor 的舊腳本、舊 fileId、舊 targetOverride 一起帶入。應改為映射 SpriteFrame / 尺寸 / 材質等視覺欄位，並斷言 live 邏輯 fileId 不變 |
| donor 材質 UUID 不存在 | 不要把缺失材質 UUID 寫入 live prefab。先查 target project 是否有等效材質，沒有就用 null/default，並在交付中列出替代 |
| `python -c` 內含 `#` 註解 | 換行後接 `#` 觸發安全檢查（path validation），需手動確認。**一律寫成 `tools/oneoff/xxx.py` 檔案再執行**，禁止用 `python -c "..."` 內聯含註解的腳本 |

---

## 現有範例腳本

| 腳本 | 用途 | 涵蓋模式 |
|------|------|---------|
| `tools/oneoff/add_dragon_info_node.py` | 新增 DragonInfoNode + MaskButton | A |
| `tools/oneoff/mount_dragon_info_components.py` | 掛載 Sprite + LocalizedSprite | B + D + C |
