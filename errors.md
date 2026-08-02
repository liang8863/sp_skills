# 錯誤日記

開發過程中踩過的坑，做類似任務前先查閱，避免重蹈覆轍。

---

## 忘記 await Loader.load()
- **情境：** Bootstrap 初始化，載入 ExternalModules
- **錯誤：** `window.ExternalModules` 是 `undefined`，後續所有服務存取都報錯
- **原因：** `Loader.getInstance().load(url)` 沒加 `await`，非同步還沒完成就往下執行了
- **修正：** 加上 `await Loader.getInstance().load(url)`
- **規則：** Loader.load() 必須 await，後續才能存取 window.ExternalModules
- **標籤：** bootstrap

## addCustomConfigure 放在 initialize 之後
- **情境：** Bootstrap 中配置自定義服務
- **錯誤：** 自定義的 ToastManager、LoadingManager 等沒生效，還是用預設實現
- **原因：** `ServiceBridge.addCustomConfigure()` 必須在 `ServiceBridge.initialize()` 之前呼叫
- **修正：** 把 addCustomConfigure 移到 initialize 之前
- **規則：** 順序必須是 addCustomConfigure → load ExternalModules → initialize
- **標籤：** bootstrap, container

## 遊戲代碼直接 import ext-module 源碼或 dist 路徑
- **情境：** 遊戲專案中需要使用 ext-module 的型別或常量
- **錯誤：** 寫了 `import type { X } from '../../slot-game-ext-module/1.0/dist/...'`，違反架構原則
- **原因：** 遊戲專案和 ext-module 是完全獨立的專案，ext-module 打包成 UMD bundle.js 動態載入。即使是 `import type`，路徑也不應指向 ext-module 目錄
- **曾發生的違規案例：**
  - `Bootstrap.ts` 的 `GAME_ACTION_TYPES`：template / mjhl / sjnw / bskg / xltb2（已全部修正）
  - `ProjectConfig.ts` 的 `IRetryConfig`：template / mjhl / sjnw / xltb2 / bskg（已全部修正）
- **修正方式：** 在 `bridge/types/core/index.ts` 新增 `IRetryConfig` 和 `GAME_ACTION_TYPES` 的 re-export，各專案改從 `bridge/types/core` import
- **新增型別的正確做法：**
  1. 型別已在 bridge/types/ 中有 re-export → 改 import 路徑指向 bridge/types/
  2. 型別不在 bridge/types/ 中 → 先在 bridge/types/ 對應檔案新增 re-export，再從 bridge/types/ import
  3. runtime 值（非 type）→ 一律從 `window.ExternalModules` 取得，搭配 `as typeof XXX` 做型別斷言
- **規則：** 遊戲代碼（`bridge/types/` 以外的檔案）禁止出現 `from '...slot-game-ext-module...'` 路徑。`bridge/types/` 本身從 ext-module re-export 型別是合法的
- **標籤：** ext-module, bootstrap, architecture

## rebind 寫成 bind 導致重複綁定
- **情境：** 在 addCustomConfigure 中替換已有的服務（如 ToastManager）
- **錯誤：** 報錯 `Cannot bind ... because it is already bound`
- **原因：** ExternalModules 的 Container 已經 bind 了預設實現，要替換必須用 `rebind`
- **修正：** `container.rebind(SERVICE_IDENTIFIERS.TOAST_MANAGER).toConstantValue(customToast)`
- **規則：** 替換已有服務用 `rebind()`，新增服務用 `bind()`
- **標籤：** container

## 遊戲代碼使用 @injectable() 裝飾器
- **情境：** 在遊戲專案中建立新的 Service class
- **錯誤：** 打包後 bundle 體積暴增，或運行時 InversifyJS 相關報錯
- **原因：** `@injectable()` 會導致遊戲專案也打包 InversifyJS，和 ext-module 的 InversifyJS 衝突
- **修正：** 移除裝飾器，改為普通 class，手動建立實例後用 `toConstantValue()` 綁定
- **規則：** 遊戲代碼中禁止使用 @injectable()、@inject() 等 InversifyJS 裝飾器，只有 ext-module 內部可以用
- **標籤：** container, ext-module

## PerformanceCtrl 在 onLoad 中呼叫 ServiceBridge
- **情境：** Xltb2PerformanceCtrl 組件掛在場景上，onLoad 中直接呼叫 ServiceBridge.getLogger() / getEventSystem()
- **錯誤：** `Error: [ServiceBridge] 尚未初始化！请先调用 ServiceBridge.initialize()`
- **原因：** Cocos 的 onLoad 在場景載入時觸發，此時 Bootstrap 的 async onLoad 還未執行到 ServiceBridge.initialize()
- **修正：** 將 ServiceBridge 存取從 onLoad 移到 registerGameEvents()，由 Bootstrap 在 ServiceBridge.initialize() 之後呼叫
- **規則：** 遊戲組件的 onLoad 中禁止呼叫 ServiceBridge，必須透過 Bootstrap 在初始化完成後手動呼叫註冊方法
- **標籤：** bootstrap, ext-module

### 5. 腳本寫入場景 targetOverride 時 Editor 快取覆蓋

- **情境：** 用腳本在場景 JSON 中新增 targetOverride，讓場景上的組件引用 prefab 內部組件
- **錯誤：** 腳本寫入後在 Editor 中看不到引用，引用欄位仍為 null
- **原因：** Editor 有未儲存的場景狀態時，再次儲存會用記憶體中的舊資料覆蓋腳本寫入的修改。腳本寫入的結構本身是正確的（與 Editor 手動設定產生的結構完全一致）
- **修正：** 先在 Cocos Editor 中**儲存場景**，再執行腳本修改場景 JSON
- **規則：** 腳本操作場景檔案前，必須確保 Editor 已儲存場景（無未儲存的變更）
- **API：** 使用 `CocosJsonEditor.add_target_override(source, property_name, target, target_file_id)`
- **標籤：** prefab, scene, cocos-editor

## 場景 targetOverride 指向嵌套 prefab 組件但運行時仍為 null

- **情境：** 場景上的 `MsxrjPerformanceCtrl` 需要引用 `GamePanel` prefab 內嵌的 `multiplier_controller` prefab 組件
- **錯誤：** 場景 JSON 已加入兩層 `localID` 的 `targetOverride`，重新刷新並打開場景後，運行時 `multiplierController` 仍為 `null`；既有 `featureBuyPanelView` 也有同類現象
- **原因：** Cocos 對「場景組件 → prefab 實例內的嵌套 prefab 組件」引用解析不穩定，不能只依賴磁碟 JSON targetOverride 判定成功
- **修正：** 保留 `@property` 和場景 JSON 綁定，同時在控制器內加入限定路徑的兼容查找，例如從 `Canvas/GamePanel/multiplier_controller` 取得 `MultiplierController`
- **規則：** 這類嵌套 prefab 組件綁定必須用 MCP/運行時腳本確認屬性實際非 null；如仍為 null，允許為既有 prefab 結構加入保守 fallback
- **標籤：** prefab, scene, targetOverride, cocos-editor, runtime-binding

## 跨遊戲複製事件發送代碼時混用 this.eventSystem 與 ServiceBridge.getEventSystem()

- **情境：** 參考 SJNW 的寫法，在 XltbPerformanceCtrl 加入 `PLAYER_DATA_EVENTS.UPDATE_WIN` 事件發送
- **錯誤：** `Uncaught TypeError: Cannot read properties of undefined (reading 'emit')`
- **原因：** SJNW 把 eventSystem 存為 `this.eventSystem`（在建構時注入），XLTB 的 PerformanceCtrl 沒有此欄位，直接複製導致 `this.eventSystem` 為 `undefined`
- **修正：** XLTB 改用 `ServiceBridge.getEventSystem().emit(...)`
- **規則：** 各遊戲的 PerformanceCtrl 存取 eventSystem 的方式可能不同。SJNW 用 `this.eventSystem`，Template/XLTB 用 `ServiceBridge.getEventSystem()`。跨遊戲複製代碼時必須確認 eventSystem 存取方式
- **標籤：** event-system, performance-ctrl

## 父節點 active=false 中斷子節點動畫，FINISHED 事件不觸發

- **情境：** 進度條轉場時，sweepB 動畫（0.556s）掛在 progressNode 的子節點上，同時啟動 megaBar 淡入 tween（0.4s）
- **錯誤：** sweepB 的 `Animation.EventType.FINISHED` 回調永遠不觸發，後續的 glow 特效也不播放
- **原因：** 淡入 tween 在 0.4s 完成時把 `progressNode.active = false`，父節點關閉導致子節點的 Animation 被中斷，FINISHED 事件不會發送
- **修正：** 將 `progressNode.active = false` 從 tween 回調移到 sweepB 的 FINISHED 回調中，確保動畫跑完才關閉父節點
- **規則：** 當子節點有進行中的動畫（Animation / Tween）時，不可關閉其父節點的 active。需要同時操作父子節點時，由最晚完成的動畫統一負責清理
- **標籤：** animation, cocos, tween

## Spine setCompleteListener 不檢查動畫名稱導致誤觸發
- **情境：** 進度條龍骨骼（XltbDragonProgressBar）用 `_playOnce` 播 spawn，DragonDisplay 在同一骨骼上播 feat_win
- **錯誤：** feat_win 播完後，`_playOnce` 的 listener 誤觸發，切換為 feat_idle，龍短暫播 idle 後才播 exit
- **原因：** Spine `setCompleteListener` 對該 track 上任何動畫完成都會觸發，listener 內沒有檢查 `entry.animation.name`
- **修正：** `_playOnce` 的 listener 加上 `if (entry.animation.name !== animName) return;` 判斷
- **規則：** 凡是用 `setCompleteListener` 監聽特定動畫完成時，必須在 callback 中先比對 `entry.animation.name`，否則只要骨骼上有其他動畫播完都會誤觸發
- **標籤：** spine, dragon-mode, progress-bar

## 龍模式轉場後 flushBarProgress 再次觸發 _transitionEggs 重新激活龍節點
- **情境：** 龍模式轉場（土/水/火）完成後若有連線，第二次 startClear 再次 scheduleOnce(flushBarProgress)
- **錯誤：** hideDragon(0) 關閉龍後，第二次 flushBarProgress 呼叫 updateProgress(10)，若第一次 tween 未完成則再次觸發 _tweenCrossStage → _transitionEggs → dragon.node.active = true
- **原因：** flushBarProgress 的排程在 startDragonTransition 之前就已執行，但轉場期間 _animObj.count 可能尚未到達段末
- **修正：** 在 startDragonTransition() 開頭立即 `unschedule(flushBarProgress)` 並呼叫 `flushBarProgress()` 一次，確保進度條完整更新後再開始轉場
- **規則：** 觸發龍模式轉場前，必須立即刷新進度條並取消任何待執行的延遲刷新，避免轉場期間/後進度條再次嘗試階段切換
- **標籤：** dragon-mode, progress-bar, schedule

## 水龍轉場後 aniCtrl 沒有連線時永久 loop rl_static
- **情境：** 水龍轉場 onAllComplete 後，clearPositions 對應的 aniCtrl 仍在 loop 播放 rl_static
- **錯誤：** 若轉場後沒有連線（不觸發 startClear），rl_static 永遠循環，造成效能洩漏與視覺殘留
- **原因：** onAllComplete 只呼叫 setAllSymbol + onDragonTransitionComplete，沒有重置 aniCtrl 動畫狀態
- **修正：** onAllComplete 中對每個 clearPosition 的 aniCtrl 改播 `rl_static` 非 loop（loop=false）；若有連線，startClear 的 playSequence(win, exit) 會以 setAnimation 打斷
- **規則：** 轉場動畫結束後，所有由轉場激活的 aniCtrl 必須重置為非 loop 狀態，不能依賴後續流程（如清除動畫）去終止它們
- **標籤：** dragon-mode, aniCtrl, water-dragon

## Loading 關閉後未切回 STANDBY 導致 Spin 不可點
- **情境：** YJZR Preview runtime 啟動完成後，畫面可見但 Spin/抽獎按鈕不可點
- **錯誤：** `LoadingPanel` 仍 active、`Bootstrap.loadingClosed=false`、`GameStateManager.currentState=opening`，`ControlPanelLogic` 因非 `standby` 狀態將 Spin Button 設為 `interactable=false`
- **原因：** Loading 關閉流程只設定 `loadingClosed=true` 與播放背景音樂，沒有同步隱藏 Loading，也沒有呼叫 `ServiceBridge.markGameReady()` 將狀態機從 `opening` 推到 `standby`
- **修正：** 在 Bootstrap 的 Loading 關閉入口統一呼叫 `completeLoadingClose()`，其中執行 `ServiceBridge.loading.hide()` 與 `ServiceBridge.markGameReady()`
- **規則：** 凡是 Bootstrap 將流程停在 `OPENING` 等待 Loading/開場表演時，真正放行玩家操作的地方必須同步完成三件事：標記 loading closed、隱藏 Loading、切回 `STANDBY`；不可只手動開啟按鈕
- **標籤：** bootstrap, loading, game-state, control-panel

## SlotReel symbol root inactive 導致掉落 callback 缺失
- **情境：** YJZR 第二段 cascade drop 後狀態停在 `spinning`，Spin/下注等動作都被狀態機阻擋
- **錯誤：** `BaseGameServiceLogic` 已收到 Spin/Cascade 回包並等待 `game:animation:complete`；runtime trace 顯示 `startDropShow` 啟動 5 軸，但第 0 軸 `dropCompleteCount=6/7`，`mgr.dropOver=[false,true,true,true,true]`，因此沒有 `AllDropOver`
- **原因：** 第 0 軸 prefab 綁定的 `iconNode` root 是 `active=false`。SlotReel 掉落邏輯會對所有 `symbolViewList` root 節點做 tween 並等待 completion；inactive root 參與掉落時 tween completion 不回，導致整軸 callback 缺失
- **修正：** 在 YJZR `MsxrjSlotReelHooks` 中確保 symbol root node 始終 `active=true`，隱藏盤面格子時只關閉 `icon/bg/tall/spIcon` 等子節點顯示，不關閉 root
- **規則：** SlotReel 的 `symbolView.getNode()` 是動畫載體，不能作為顯示隱藏開關。需要隱藏格子時只隱藏子節點；排查 `spinning` 卡住時先看每軸 `dropCompleteCount / symbolViewList.length / root active`
- **標籤：** slot-reel, cascade, tween, prefab, runtime

## 跨 bundle 继承 ExternalModules 原生 class 导致启动崩溃
- **情境：** YJZR 在 `Bootstrap` 创建 `GamePanelLogic` 时传入游戏侧自定义 `marqueeBarLogicClass`。
- **错误：** 预览/网页启动时报 `TypeError: Class constructor AbstractMarqueeBarLogic cannot be invoked without 'new'`，堆栈落在 `CustomMarqueeBarLogic.ts` 构造阶段。
- **原因：** 游戏代码里的 `class extends window.ExternalModules.AbstractMarqueeBarLogic` 会被构建链路降级成 helper 继承；运行时通过 `_super.call(...)` 调用 ExternalModules bundle 里的原生 ES class，原生 class 禁止被普通函数方式调用。
- **修正：** 游戏侧不要直接跨 bundle 继承 ExternalModules 的运行时 class。改成组合/代理：在构造函数里 `new BaseLogic(...)` 作为 fallback defaultLogic，自定义逻辑只实现同名 public API 并在需要时委托给 defaultLogic。
- **规则：** 需要扩展 ExternalModules 行为时，优先用组合、ServiceBridge、hook、配置类入口；不要把 `window.ExternalModules.*` class 当作游戏侧 `extends` 的父类。
- **标签：** bootstrap, ext-module, runtime-class, marquee
