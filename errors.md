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

## Cocos CLI 與既有編輯器快取衝突導致驗證結果失真
- **情境：** HGCS 補齊 `assets/scripts/bridge` 與 `vendor/external-modules/1.0` 後，用已開啟的 Cocos Creator 專案做命令列腳本驗證。
- **錯誤：** `buildScriptsOnly` 在既有 Cocos 編輯器同時開啟時退出 `-1073741819`；`temp/programming/packer-driver` 仍保留補檔前的缺模組解析記錄。
- **原因：** 編輯器程序持有 project cache，命令列與編輯器同時刷新時可能互相競爭；舊 `assembly-record.json` 不代表目前檔案系統狀態。
- **修正：** 不終止使用者的編輯器程序；先觸發 bridge/vendor 檔案重新索引，再以 asset-db 日誌確認 Rollup 已讀取 `ServiceBridge.ts`，並以相對導入靜態檢查補充驗證。
- **規則：** Cocos CLI 驗證前先確認沒有同一專案的編輯器程序；若不能關閉，不能把舊 assembly record 的缺模組項目直接判定為目前程式錯誤。
- **標籤：** cocos, cli, cache, service-bridge, validation
## HGCS runner route and local dependency startup
- **Context:** The HGCS runner source/module still uses the legacy `jdsry` name.
- **Symptom:** The process starts successfully but the client receives 404 when it requests `/v1/hgcs/*`.
- **Cause:** `boot.WithGamePath("JDSRY")` controls the REST route and Redis game prefix; the runner registration key alone does not change it.
- **Fix:** Register the game as `"HGCS"` and pass `boot.WithGamePath("HGCS")`. Start local Redis on `26379` and MySQL `games_ways` on `23306` before launching the runner.
- **Rule:** Verify `/_internal/health`, `/v1/hgcs/bets`, and the configured client API base URL independently. The runner exposes game routes only; login and wallet routes require the API gateway.
- **Tags:** backend, runner, route, redis, mysql, api-gateway

## HGCS preview must bypass gateway auth
- **Context:** Cocos Preview targets the local HGCS runner directly at `localhost:8060`.
- **Symptom:** Bootstrap stops at `/v1/users/dev/login` or `/v1/wallets/balance`, because those gateway routes are not implemented by the runner.
- **Cause:** Preview startup followed the standalone gateway login flow instead of the local runner flow.
- **Fix:** In `PREVIEW`/`EDITOR`, seed deterministic player data and send `X-User-ID`, `X-User-Account`, `X-Operator-ID`, and `X-Currency` on local API requests.
- **Rule:** Keep login/balance calls for non-preview gateway environments; do not add fake auth fallback to production or iframe Host mode.
- **Tags:** bootstrap, api, preview, runner, gateway

## Migrated LoadingPanel assets and fixed positions can hide the close button
- **Context:** A Cocos 2.x loading prefab was migrated into a Cocos Creator 3.8 project and previewed in a shorter browser canvas.
- **Symptom:** The loading background or start button is blank, the button cannot be reached, and `getComponent: Type must be non-nil` may appear as a companion editor error.
- **Cause:** The prefab still references obsolete SpriteFrame UUIDs, while its root Widget follows the preview height but child controls keep design-resolution Y coordinates and move outside the visible canvas.
- **Fix:** Remap the serialized SpriteFrame references to imported 3.x assets, validate the exact prefab through asset-db, and reposition bound control nodes from `view.getVisibleSize()` with edge constraints.
- **Rule:** For migrated loading prefabs, verify both reference resolution and world-space bounds at every supported preview orientation. Use serialized `@property` bindings for layout; do not add dynamic `getComponent` lookups as a workaround.
- **Tags:** cocos, migration, loading, prefab, sprite-frame, responsive-layout

## Invisible migrated Button overlay consumes Loading clicks
- **Context:** HGCS mounts a migrated total-win prefab while the startup LoadingPanel is still visible.
- **Symptom:** Clicking the visible loading button does nothing and logs `getComponent: Type must be non-nil` from `component-event-handler.ts`.
- **Cause:** `hgcs_total_win/skip_btn` is a transparent full-screen Button mounted above LoadingPanel. Its legacy ClickEvent targets the removed `TotalWinController`, so Cocos imports an empty component name and calls `getComponent("")` when the overlay receives the click.
- **Fix:** Remove the obsolete serialized ClickEvents, clear runtime Button clickEvents before registering the replacement handlers, and keep the total-win root and its controls inactive until `openPayoutPanel()` starts the presentation.
- **Rule:** When a visible Cocos button cannot be clicked, inspect every active pointer event processor at that world coordinate. Opacity does not disable hit testing, and migrated ComponentEventHandlers must not retain removed script class names.
- **Tags:** cocos, input, button, component-event-handler, migration, overlay

## Runtime gameConfig must not gate build-only debug UI
- **Context:** A development-only Cocos control was hidden through `GameConfig.isDev`.
- **Symptom:** The control could be created in an STG build before the deployed `gameConfig.json` override was loaded.
- **Cause:** `GameConfig.ts` contains the baked development default, while `gameConfig.json` is merged asynchronously at runtime. Component initialization can observe the default first.
- **Fix:** Gate build-only debug UI with the compile-time `DEV` constant from `cc/env`. STG/REL/PROD workflows must build with `debug=false`.
- **Rule:** Use runtime `GameConfig.isDev` for runtime behavior and logging only. Use `DEV` for controls or code paths that must never appear in non-debug packages.
- **Tags:** cocos, build, debug-ui, game-config, stg

## Migrated Spine WebP metadata can omit the Texture2D subasset
- **Context:** Cocos 2.x Spine atlases were copied into a Cocos Creator 3.8 project with `.webp.meta` files marked as raw images.
- **Symptom:** The Spine skeleton imports, but preview reports that `<image-uuid>@6c48a` is missing for every skeleton using the atlas.
- **Cause:** The image meta has an empty `subMetas` object, so the Texture2D subasset referenced by the Spine data is never registered.
- **Fix:** Add the `6c48a` texture submeta, set the image type to `texture`, and redirect the image to `<image-uuid>@6c48a` before refreshing the asset database.
- **Rule:** Validate both the SkeletonData UUID and every atlas texture subasset after importing migrated Spine resources.
- **Tags:** cocos, migration, spine, webp, texture, asset-db

## Disabled legacy Mask can leave an enabled Graphics renderer
- **Context:** A Cocos 2.x rectangular Mask is imported into Cocos Creator 3.8 and serialized with `_enabled: false`.
- **Symptom:** Preview repeatedly throws `Cannot read properties of null (reading 'globals')` from `Model.updateUBOs` and `Batcher2D._insertMaskBatch`.
- **Cause:** `Mask.onLoad` can still add a Graphics component whose renderer remains enabled even though the Mask itself is disabled.
- **Fix:** After all `onLoad` calls, disable the generated Graphics in `start`, or replace the migrated graphics mask with a validated SpriteStencil mask.
- **Rule:** Inspect both Mask and generated Graphics runtime states; disabling only the serialized Mask is not sufficient evidence that it cannot render.
- **Tags:** cocos, migration, mask, graphics, renderer, preview

## HGCS debug runner startup resets shared Redis and cannot coexist on default gRPC port
- **Context:** Start the HGCS runner locally while another runner already uses gRPC port 8061.
- **Error:** The default configuration exits after the REST listener starts because gRPC cannot bind. With `engine.debug: true`, startup also clears shared Redis frames, runner snapshots, and RTP cache before the bind failure.
- **Cause:** The `--port` flag overrides only `rest.port`; it does not change `grpc.port`. Engine debug startup routines mutate shared cache state.
- **Fix:** Use an isolated configuration with `engine.debug: false` and distinct REST/gRPC ports, such as 8062/8063, for route validation.
- **Rule:** Treat runner startup configuration as a state-changing operation. Verify both listeners before starting, and do not use the default debug profile against a shared Redis database.
- **Tags:** backend, runner, redis, grpc, startup, api

## Engine runner unit tests require a Snowflake node backed by Redis
- **Context:** Run `BaseGame.Run` directly in an HGCS unit test to compare two complete seeded frame chains.
- **Error:** The first Spin panics with `snowflake node is not initialized`.
- **Cause:** `BaseGame.newSpin` calls `engine.Int64`, but the SDK initializes its Snowflake node only through an unexported Engine startup path that uses Redis.
- **Fix:** Keep unit tests at the pure gameplay-hook level. Run full frame-chain/replay tests through an isolated Engine and Redis integration environment, where startup initializes the node.
- **Rule:** Do not work around SDK internals with unsafe state or point a test at shared Redis merely to satisfy an ID generator dependency.
- **Tags:** backend, engine-sdk, snowflake, redis, testing, hgcs

## Buy-free first layout skips normal runner callbacks
- **情境：** HGCS runner 透過 Engine SDK 的 `BuyFreeFirstLayoutFunc` 產出購買免費遊戲的首個 Scatter 畫面。
- **錯誤：** 首幀有 3 個以上 Scatter，卻沒有進入免費遊戲，`GetSpinChance()` 回傳 0。
- **原因：** SDK 的 `newSpinForBuy()` 不會呼叫遊戲的 `OnSpinStart()` 或 `BeforeCurrentLayoutArchive()`，而是直接呼叫 `BuyFreeFirstLayoutFunc` 後執行 `GetSpinChance()`；若遊戲只在一般歸檔回呼填入 Scatter 狀態，計數仍是零。
- **修正：** 在 buy-first-layout 回呼內建立與自然 Scatter 觸發相同的 `ScatterCount`、`ScatterPositions`、Spin 初始倍率與去重旗標，再交給共用 `GetSpinChance()` 初始化 Feature。
- **規則：** 任何使用 `BuyFreeFirstLayoutFunc` 的 runner 都必須測試「產生首幀 → GetSpinChance → Feature 已初始化」完整路徑；不可假設 buy 路徑會走一般 Spin 的生命週期。
- **標籤：** backend, engine-sdk, buy-free, state-machine

## Cluster award positions are not the cascade elimination set
- **情境：** HGCS 以 Engine `BaseGameForCluster.Results()` 輸出 Cluster 中獎與連消回應。
- **錯誤：** SDK 預設由所有 award `pos` 組成 `ptbr`，把固定 Wild 和 Scatter 觸發位置一起交給客戶端消除。
- **原因：** `snwm.pos` 的語意是中獎/觸發高亮，包含可替代的 Wild 與 Scatter；`ptbr` 的語意則是盤面實際移除格，兩者不是同一集合。
- **修正：** HGCS 覆寫 `Results()`，只從普通符號 Cluster 的位置中保留盤面上仍為普通符號的單格到 `ptbr`；獎項原始 `pos` 保持不變。
- **規則：** 使用固定 Wild、Scatter 或其他不可消除特殊符號的 cascade runner，必須對 response 層另測 `snwm.pos` 與 `ptbr`，不可只測 `Eliminate()`。
- **標籤：** backend, engine-sdk, cluster, cascade, response-contract

## Deferred settlement can delay MaxMulti interruption
- **情境：** HGCS 將中間 Cluster 的 `AllMulti` 歸零，等最後結算幀才派彩，以保證錢包只入帳一次。
- **錯誤：** Engine 的 `MaxMulti` 檢查看不到中間獎項，只有等下一張無獎盤才觸發，封頂前會多跑 cascade，並可能錯誤取得免費次數。
- **原因：** Engine 在每張 layout 歸檔後依 `AllMulti` 判斷是否中斷；延遲結算使該值在中獎幀保持零。
- **修正：** 當「既有累計 + 本 Spin 基礎獎 x 當前倍率」達上限時，在該中獎幀附加最終 `HGCS_SETTLE`；Engine 立即截斷、停止流程並建立 `MaxMultiCap` 安定終止幀。
- **規則：** 任何採延遲結算的 cascade runner，都必須在中獎幀預測總局封頂，並測試封頂不會繼續消除或觸發 Feature。
- **標籤：** backend, engine-sdk, max-win, cascade, settlement

## PowerShell script root is unavailable in parameter defaults
- **情境：** 新增 HGCS 隔離 debug 基礎設施預檢，預設設定檔路徑相對於腳本。
- **錯誤：** 執行腳本在任何預檢前即失敗，`Join-Path` 回報空白 `Path`。
- **原因：** PowerShell 在為腳本 body 指派 `$PSScriptRoot` 之前，就會評估 `param()` 的預設運算式。
- **修正：** 將路徑參數預設為空字串，在 `param()` 完成後才從 `$PSScriptRoot` 推導相對路徑。
- **規則：** 不得在 PowerShell 參數預設值中使用 `$PSScriptRoot`。所有腳本相對預設值都應在 body 內解析，並實測未帶參數的呼叫路徑。
- **標籤：** backend, powershell, debug-infra, startup, validation

## PowerShell native probe stderr can bypass a collected preflight result
- **情境：** HGCS 預檢以 `redis-cli` 和 `mysql` 檢查尚未就緒的隔離依賴。
- **錯誤：** 當 `$ErrorActionPreference = 'Stop'` 時，失敗的 native command stderr 被提升成 `NativeCommandError`，第一個 Redis 錯誤直接中斷腳本。
- **原因：** 將 native stderr 合併至 PowerShell error stream 後，嚴格錯誤偏好會在結果可被彙總前拋出終止例外。
- **修正：** 將 native command 包裝成短暫的 non-terminating probe，保存 exit code 和輸出，再恢復嚴格偏好並統一報告所有 Gate 失敗。
- **規則：** 健康檢查或預檢必須區分「依賴未就緒」和「腳本執行錯誤」；前者應聚合成可操作清單，不能被第一條 stderr 吃掉。
- **標籤：** backend, powershell, native-command, debug-infra, validation

## Provisional cascade weights can invalidate engine seed generation
- **Context:** Restart the HGCS runner against the default local service profile after replacing its game logic and placeholder math table.
- **Error:** Engine seed generation aborted on seed `161188843234487559` with `HGCS max layouts per spin exceeded: 100`; deterministic replay still had a normal award on layout 100.
- **Cause:** The game had marked its weights as provisional, but the Engine startup seed-library workflow ignored `skip-rtp-control` and simulated natural spins through every registered manager.
- **Fix:** Make Engine honor `skip-rtp-control` before startup seed generation; bind provisional HGCS to `rtp.NilManager()` and disable every RTP switch in the provisional plan. Keep the failing seed as an explicit math-signoff gate rather than inventing an undocumented cascade cap.
- **Rule:** A provisional slot plan must not participate in RTP seed generation or payout steering. Enable a real RTP manager only after an approved fixed plan passes deterministic replay and RTP certification, including a bounded-cascade review.
- **Tags:** backend, hgcs, cascade, rtp, seed-generation, math

## Feature Buy enters FG before FreeGameController panel state is ready
- **Context:** HGCS PreviewInEditor enters the free-game flow directly after Feature Buy.
- **Error:** `HbfyFreeGameController._onShowRemainingPanel` throws `Cannot set properties of null (setting 'freeSpinStep')`.
- **Cause:** `HbfyPerformanceCtrl` dynamically attaches `HbfyFreeGameController` to the migrated `FreeGameController` node, so its serialized `freeSpinController` property is empty even though the sibling `Canvas/GamePanel/free_spin_controller` node exists.
- **Fix:** Resolve the sibling `FreeSpinController` by bounded hierarchy path at controller startup and again at every remaining-spin callback. Validate the component before writing `freeSpinStep`; keep the original FG payload intact.
- **Rule:** Feature Buy and normal FG entry must resolve the runtime counter node before writing remaining-spin fields; a missing UI binding must not throw a TypeError or invent spin data.
- **Tags:** cocos, feature-buy, free-game, initialization-order, runtime-binding

## HGCS BonusLoading prefab resolves to a legacy controller UUID
- **Context:** Feature Buy enters FG on the migrated `bonus_loading_controller` prefab.
- **Error:** The loading page is skipped or `LegacyBonusLoadingController.show()` throws `Cannot read properties of null (reading 'getComponent')`.
- **Cause:** The prefab keeps the donor `LegacyBonusLoadingController` script UUID while its child hierarchy is the HGCS `bl_*`/`fsr_*` resource layout. The legacy controller fields therefore remain unbound.
- **Fix:** When an HGCS free-game controller finds the legacy component, mount `HbfyBonusLoadingPanel` on the same node and use its name-based resource binding. Keep the legacy component only for prefab compatibility.
- **Rule:** A migrated loading prefab must be validated by controller class and child hierarchy together; a resolved component UUID alone does not prove its serialized property bindings are compatible.
- **Tags:** cocos, migration, feature-buy, free-game, bonus-loading, runtime-binding

## HGCS TotalWin prefab script type must use the compressed Cocos UUID
- **Context:** FG exit opened no TotalWin panel after importing the HGCS resource prefab.
- **Error:** The `totalwin_controller` node contained only `UITransform`/`UIOpacity`; the custom `HbfyTotalWinPanel` component was missing at runtime.
- **Cause:** The prefab script entry had been serialized as `cc.UIOpacity` (and the `@ccclass` identifier is not the serialized Cocos script type). Cocos Creator resolves imported scripts by the compressed asset UUID.
- **Fix:** Bind the root component to `dd4d8pnxq9DNp9uD3PI5u9W`, the compressed UUID for `HbfyTotalWinPanel.ts`, then refresh the prefab before previewing.
- **Rule:** For migrated Cocos prefabs, verify the serialized `__type__` against the generated script asset UUID and validate the runtime component class; never substitute the TypeScript `@ccclass` id.
- **Tags:** cocos, migration, prefab, total-win, runtime-binding

## Fresh runner schema is consumed before the boot migration runs
- **情境：** 使用全新隔離 MySQL schema 啟動單遊戲 runner，並保持 `engine.debug=false` 以避免清除共享狀態。
- **錯誤：** 程序在綁定 REST/gRPC 前 panic：`ensure per-game seeds table failed`，原因是基礎表 `game_seeds` 尚不存在。
- **原因：** `NewSlotGameEngine()` 在建構期間先啟動 RTP/seed manager；`boot.newSlotSdkV3()` 的 `e.Migrate()` 要等 constructor 返回後才執行，因此無法替完全空白的 schema 建立 constructor 已先要求的表。
- **修正：** 在首次啟動前執行正式 migration，或從同版本已遷移 schema 只複製基礎表結構；本次只複製 `game_seeds` 與對應的 per-game seed table，不複製資料，再重新啟動。
- **規則：** 新 runner 的隔離資料庫不能只建立空 schema；預檢必須確認 engine constructor 所需基礎表已存在。長期修復應讓 shared boot 在 engine manager 啟動前完成 schema migration。
- **標籤：** backend, runner, mysql, migration, startup, isolation

## Windows PowerShell 5 misreads UTF-8 scripts without BOM
- **情境：** `s_ser` 的 scheme 結構校驗腳本需要存取 `slot-rtp-scheme` 的中文 `试玩版json` 目錄。
- **錯誤：** 腳本語法檢查通過，但由 `powershell.exe` 執行時中文路徑變成亂碼，真實 JDSRY 參考目錄被誤判為不存在，測試檔名也觸發 `Illegal characters in path`。
- **原因：** Windows PowerShell 5 會用系統 ANSI code page 解讀沒有 BOM 的 UTF-8 `.ps1`；編輯器與靜態 parser 以 UTF-8 讀取時不會重現。
- **修正：** 保持可執行 `.ps1` 為 ASCII，使用 Unicode code point 在 runtime 組合必要的中文路徑與檔名。
- **規則：** 需要由 Windows PowerShell 5 執行的無 BOM 腳本不得直接包含非 ASCII 路徑字面量；必須使用 code point 組合、ASCII alias，或在產生流程中明確保證 BOM，並以 `powershell.exe` 實際執行驗證。
- **標籤：** powershell, windows, encoding, scheme, validation

## Cascade continuation breaks request-count Spin sampling
- **情境：** 使用 `chrome_devtools` MCP 對 Cocos Canvas 的 PKWG Spin 控件做競品採樣。
- **錯誤：** 將 `/Spin` 網路請求數直接當作玩家觸發的 Spin 次數，並把同一次操作出現的多筆請求誤判為重複輸入。
- **原因：** 單次 `SGSpinButtonController.clickSpinButton()` 已證明可產生兩筆成功 `/Spin`；同一端點也承載 cascade continuation，不能由請求數推斷頂層玩家操作數。
- **修正：** 以一次已記錄的控制器/UI 觸發到控件完整回 idle 為一個頂層 Spin，保存該 transaction 的完整 `/Spin` 請求鏈、結果與 idle 回復時間。多事件 DOM 手勢仍不得用於批量採樣，因為它無法建立可靠的輸入邊界。
- **規則：** Cascade 遊戲的採樣帳本必須分開記錄 `topLevelSpinCount` 和 `spinRequestCount`；只有完整 transaction 才能計入完成 Spin，請求數只能作為傳輸證據。
- **標籤：** chrome-devtools, competitor-analysis, cocos, cascade, input, spin-sampling

## Polling can miss Cocos button busy transitions
- **情境：** 以 `chrome_devtools` MCP 對競品 Cocos Spin 控制器進行 controller-to-idle 採樣。
- **錯誤：** 每 100ms 輪詢 `_isInteractable`，把沒有觀察到 `false` 視為未進入 busy。
- **原因：** `SGSpinButtonController.clickSpinButton()` 已實際產生成功 `/Spin`，但互動狀態的切換可短於輪詢週期，或由 callback 同步完成。
- **修正：** 在單筆採樣期間包裝既有 `_setSpinButtonInteractive`，只記錄 true/false 時間戳與原方法結果；交易回 idle 且靜默後立即還原原方法。
- **規則：** 競品 runtime 採樣不可用低頻快照否定短暫 UI state；以最小、可還原的觀測 hook 保存 state transition，並保留完整請求鏈與 idle 證據。
- **標籤：** chrome-devtools, competitor-analysis, cocos, state-observation, spin-sampling

## Non-cascade presentation needs both SPIN_RESULT and SPIN_COMPLETE acknowledgements
- **情境：** FLP 使用 ExternalModules 的 `BaseGameServiceLogic` 執行沒有 cascade 的 3x3 Spin。
- **錯誤：** API 成功且九個 symbol 已渲染，但流程停在 elimination wait，Spin 無法回到 standby。
- **原因：** presentation 在 `SPIN_RESULT` 完成後只發出一次 `ANIMATION_COMPLETE`；該事件只解除第一個等待。平台接著發出 `SPIN_COMPLETE` 並等待第二次 completion 才結束 Spin。
- **修正：** presentation owner 註冊 `SPIN_COMPLETE`，只對同一個 terminal non-cascade generation 發出第二個 `ANIMATION_COMPLETE`；完成後清除 awaiting generation 並去重。
- **規則：** 接入 `BaseGameServiceLogic` 的非 cascade 遊戲必須以 runtime event sequence 驗證兩階段 completion，不可因 `isCascade=false` 就假設一次 completion 足夠，也不可從 GameService 偽造事件。
- **標籤：** cocos, lifecycle, spin-complete, animation-complete, non-cascade, flp

## Cocos 2 compact Euler ObjectTrack crashes Cocos 3.8 animation evaluation
- **情境：** FLP 勝局播放由 Cocos 2.x 搬入的 `wh_vfx_e_random.anim`。
- **錯誤：** 動畫引擎反覆拋出 `Cannot read properties of undefined (reading 'x')`，stack 為 `Vec3.copy -> Node.setRotationFromEuler -> ObjectTrack.evaluate`；no-win 正常，win presentation 卡住。
- **原因：** 四條 `eulerAngles` `ObjectTrack` 的 `ObjectCurve` key value 仍是 Cocos 2.x 緊湊陣列 `[1,0,0,z]`，Cocos 3.8 將其當成 `Vec3` 物件讀取。
- **修正：** 將每條 track 就地轉為 `cc.animation.UntypedTrack`，以單一 `property: "z"` 的 `UntypedTrackChannel + RealCurve` 保存原 path、time 與 Z 值；保持 root track ID、duration、wrapMode 及 `.meta` UUID不變，然後由 AssetDB refresh。
- **規則：** 遷移 `.anim` 時必須掃描 `eulerAngles` ObjectTrack；不得只驗證 JSON 可解析。至少以一個會實際播放該 clip 的 win path 驗證，並檢查沒有 `Vec3.copy/setRotationFromEuler` error。
- **標籤：** cocos, migration, animation, object-track, euler-angles, vec3, flp

## Nested InfoBar instances do not share the current win value
- **情境：** FLP 在主資訊列已有非零贏分時開啟自動旋轉面板。
- **錯誤：** 面板內的 `CustomInfoBarView` 贏分顯示被重設為 `0`，與主資訊列不同步。
- **原因：** 主資訊列與自動旋轉面板各自實例化一份 `CustomInfoBarView`；框架開啟面板時以 `AbstractAutoSpinPanelLogic.currentWin` 的初始值更新內嵌資訊列。兩者使用相同 Prefab 和 `IconSprite` 並不代表共享數值狀態，實際數值由同層 `Label` 持有。
- **修正：** 在 `openAutoSpin` 原始狀態處理完成後，透過 View 的既有存取器把主資訊列已格式化的 win Label 字串同步到面板內的 win Label。
- **規則：** 重複實例化資訊列的面板必須在開啟邊界同步當前顯示值；不得以共用 Prefab 或圖示節點推斷兩個執行個體共享狀態。
- **標籤：** cocos, flp, auto-spin, info-bar, state-sync, initialization-order
