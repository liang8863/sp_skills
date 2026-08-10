# Slot 客户端通用功能速查

## 目的

本文档基于以下两个已完成项目的静态代码、配置、事件类型和 Prefab 目录扫描：

- `E:\CCCCCC\slot-fe-client\games\yjzr`
- `E:\CCCCCC\slot-fe-client\games\jdsry`

用于支撑 `s_cli` 的需求拆解、影响面判断和验收设计。本文档总结的是两个项目共同呈现出的 Slot 客户端功能边界，不把某个项目的轴数、字段名、玩法参数或资源路径当成通用规则。

静态速查不能代替运行时验证。涉及金额、订单、动画时序、Prefab 绑定或接口协议时，仍需回到当前项目取证并执行实际流程。

**本速查表不是实现行为的来源。** `s_cli` 处理具体游戏需求时，必须以该游戏对应资源工程的真实逻辑为基准；本文只回答“需要查哪些能力、如何拆解验收”，不能用来决定触发条件、流程顺序、玩法参数、动画、音频、延时、节点或 callback。资源工程未证明的行为不得由 Agent 自由补充。

### 资源工程对照 Gate

```text
先定位资源工程
  -> 找到需求对应脚本、Prefab/Scene、动画/音频和调用链
  -> 记录 source -> target -> adaptation
  -> 资源工程行为完整：生成计划
  -> 证据缺失：NEEDS_RESOURCE_BASELINE，停止实现
  -> 实作后用同一触发输入做行为对照验收
```

允许的差异仅限 Cocos 版本、Bridge/API、语言资源加载和目录结构等兼容适配；适配后可观察行为必须与资源工程一致。通用速查、其他成品项目、竞品截图和 Slot 经验都不能替代当前游戏资源工程。

## 一、总生命周期

```text
Bootstrap / Loading
  -> HostBridge / Language / ExternalModules 初始化
  -> GamePanel / BetPanel / Service 配置
  -> checkLastSpin
  -> Idle / Standby
  -> Spin intent
  -> bet snapshot / transaction request
  -> raw response -> mapper -> client result
  -> SPIN_RESULT 或特有结果事件
  -> Reel start -> stop -> symbol land
  -> Win / payout / multiplier / effect
  -> Cascade / drop / next frame（如果存在）
  -> Free Game / Bonus / Respin（如果存在）
  -> Total Win / Big Win / settlement
  -> completion -> Idle
```

所有需求先定位在这个生命周期中的阶段，再定位具体脚本。不要直接从一个控制器文件名推断根因。

## 二、模块总表

| 模块 | 分析模型 | 主要职责 | 常见入口/证据 | 典型验收 |
| --- | --- | --- | --- | --- |
| Bootstrap / Loading | `terra` | 宿主通信、语言、ExternalModules、GamePanel、首次启动、Last Spin 恢复 | `Bootstrap.ts`、`bridge/README.md`、Loading Prefab | 能完成加载、语言初始化、GameReady、GamePanel 可用、未完成订单可恢复 |
| Bridge / ExternalModules | `terra` | ServiceBridge、HostBridge、Loader、EventSystem、Audio、PlayerData、GameState | `assets/scripts/bridge` | 初始化顺序正确；服务可取到；Host 事件和游戏事件不丢失 |
| GamePanel / Control | `terra` | Spin、Stop、Turbo、Auto Spin、Bet、Feature Buy、Setting 入口 | `custom/GamePanel`、`SpinButton*`、Control/Bet Panel | 状态正确、点击防重、急停/自动旋转可用、余额/下注期间禁用正确 |
| GameService / 交易 | `terra` | bet 快照、Spin、Auto Spin、Feature Buy、Last Spin、恢复、余额/交易完成 | `services/GameService.ts`、`api`、`bridge/types/gameLogic` | 请求、响应、事件、表现、余额和最终完成状态一致 |
| API / Mapper / Types | `terra` | raw 请求响应、camelCase 转换、订单/金额/布局字段 | `api/GameApi.ts`、`api/types`、mapper | 不丢字段、不误读缩写；父子订单和每帧/整局金额可区分 |
| Event / State | `terra` | 统一事件、payload、游戏状态转换、事件去重 | `types/GameTypes.ts`、GameStateManager、Performance | 发布者/消费者配对；重复结果不会重复结算；异常能回到可用状态 |
| Reel / SlotReel | `sol` | 结果布局、停轮、符号显示、Wild/Scatter、长符号、坐标、消除/下落 | `CustomSlotReel*`、布局 helper、Reel hooks | 每个位置映射正确，停轮/下落/遮罩/特效无错位 |
| Performance | `terra` | 把结果事件编排成视觉生命周期 | `*PerformanceCtrl.ts`、`PerformanceCtrlBase.ts` | 普通 Spin、Cascade、Free Game、BigWin、TotalWin 的顺序和回调完整 |
| InfoBoard | `terra` | 跑马灯、Win、Total Win、Scatter/FG 提示、底板、倍率和清理 | `Infoboard*`、`InfoBoardControllerBase`、InfoBoard Prefab | 文案/金额/模式/动画/回调/清理正确 |
| Win / Payout | `terra` | 中奖高亮、金额滚动、符号派彩、Wild/Scatter 特效 | `Win*`、`Payout*`、`Symbol*` | 中奖位置、金额、特效顺序和结束回调一致 |
| BigWin / TotalWin | `terra` | 大赢等级、全屏动画、总赢滚动、收集/跳过/退场 | `BigWin*`、`TotalWin*`、对应 Prefab | 阈值、金额、音效、跳过、结算和下一 Spin 清理正确 |
| Free Game / Bonus | `sol` | 触发、入场、BonusLoading、FG UI、剩余次数、Retrigger、退出结算 | `FreeGame*`、`BonusLoading*`、`Remaining*` | 进入/恢复/重触发/结束/TotalWin/回普通 UI 的链路完整 |
| 特有玩法 | `terra`；直接 Reel 改动用 `sol` | Cascade、倍率、Respin、Slow Drop、Ways、Feature Buy 等 | 当前项目专属 hooks/controllers/config | 只按当前项目协议验收，不套用另一个项目的玩法参数 |
| Resource / Prefab | `terra` | Scene 节点、Component、UUID/meta、Prefab、Sprite/Spine/Animation/Audio | `assets/resources`、Prefab 文本、资源路径常量 | 绑定存在、类型正确、资源可加载、启用/禁用时机正确 |

模型列表示默认路由。混合需求只要需要直接修改 Reel/SlotReel/布局能力，或涉及 Free Game/Bonus 的触发、入退场、专用 UI/资源、Retrigger、Restore、单轮 Big Win、最终结算及其关联链路，整次需求分析改用 `sol`；否则使用 `terra`。

## 三、模块速查

### 3.1 Bootstrap / Loading / Bridge

**职责**

- 初始化 HostBridge，接收语言、Token、Host 输入和生命周期消息。
- 加载 ExternalModules，并在其初始化前注册游戏自定义配置。
- 建立 GamePanel、BetPanel、GameService 和 action executor 的连接。
- 加载 bets/config，关闭 Loading，检查 Last Spin，决定进入 Idle 或恢复表演。
- 通知 Host 游戏已就绪。

**两个项目共同模式**

```text
HostBridge.initialize()
  -> waitForLanguage()
  -> Loader.load(...)
  -> addCustomConfigure(...)
  -> ServiceBridge.initialize()
  -> GamePanel/BetPanel/GameService 连接
  -> notifyGameReady()
```

实际代码可能把 `addCustomConfigure` 放在 Loader 前后不同的辅助函数中，验收以当前项目真实顺序为准；关键约束是自定义配置必须在 `ServiceBridge.initialize()` 前完成。

**需求拆解**

- 启动问题：先查初始化顺序、异步等待、ExternalModules 是否存在、GamePanel 是否找到。
- Loading 问题：查加载完成事件、错误/重试、关闭条件和 Last Spin 分支。
- Host 问题：查 HostBridge 消息来源、事件监听、语言/Token 是否在消费前就绪。

**验收**

- 正常首次启动：Loading 关闭、语言正确、GameReady 发出、Spin 可点击。
- 已有未完成 Spin：Last Spin 被检查并恢复，不重复下注。
- ExternalModules/网络失败：有明确错误路径，不能让界面停在不可操作的半初始化状态。

### 3.2 GameService / API / 交易

**职责**

`GameService` 是交易生命周期与游戏专属 hooks 的边界，不负责直接操作节点。两个项目都使用 `BaseGameServiceLogic` 处理通用流程，再由项目 hooks 定义：

- 游戏 ID。
- Last Spin 是否未完成。
- 恢复后是否进入 Free Game 模式。
- 首次 Spin 结果和后续 Cascade 结果使用哪个事件。
- Spin 完成时如何触发 Free Game。
- 恢复完成后如何重新进入完整表演链。
- 是否自动更新余额、是否提供 Feature Buy、是否提供画面赢分更新。

**常见公开入口**

```text
setGetBetInfoCallback()
setGetTurboModeCallback()
checkLastSpin()
restoreLastSpin()
spin(betInfo)
autoSpin(count, betInfo)
featureBuy(betInfo)
stopAutoSpin()
```

**需求拆解**

任何 API 或金额问题都要写清：

```text
用户动作
  -> BetPanel 产生 bet snapshot
  -> GameService / BaseGameServiceLogic
  -> API raw request
  -> raw response
  -> mapper / camelCase result
  -> event + transaction state
  -> Performance / UI consumer
  -> balance / completion
```

**验收**

- betSize、betLevel、betWays、betAmount 与实际请求一致。
- 每帧赢分、单次 Spin 累计赢分、整笔订单总赢分不混用。
- `isNewSpin`、`isSpinFinished`、`isFinished`、Free Game 次数和父子订单关系被正确消费。
- API 失败、Last Spin 恢复、重复事件和 Auto Spin 停止都回到可控状态。

### 3.3 Event / State / Performance

**通用事件类别**

| 类别 | 事件示例 | 消费者 |
| --- | --- | --- |
| Spin | `SPIN_START`、`SPIN_RESULT`、`SPIN_COMPLETE` | Reel、Performance、SpinButton、InfoBoard |
| 停轮 | `STOP_REEL_SPIN` | Reel/Performance/SpinButton |
| Cascade | `CASCADE_START`、`CASCADE_RESULT` | Reel、消除、倍率、InfoBoard、Performance |
| Free Game | `FREE_GAME_START`、`FREE_GAME_END` | FreeGame、Performance、InfoBoard、BGM |
| Restore | `LAST_SPIN_RESTORE` | Reel、FreeGame、Performance、UI |
| Auto Spin | `AUTO_SPIN_START/PROGRESS/COMPLETE` | SpinButton、ControlPanel、Performance |
| 其他 | `MULTIPLIER_CHANGE`、`RESPIN_*` | 由当前项目专属模块消费 |

**Performance 的职责**

- 注册事件并保存本次结果快照。
- 控制“开始转 -> 收到结果 -> 停轮 -> 落地 -> 中奖/消除 -> 下一帧/结算”。
- 统一处理 `AllSpinOver`、`AllDropOver`、`SPIN_COMPLETE` 的先后竞争。
- 在 Free Game 最后一轮、BigWin、TotalWin 或 Retrigger 的动画结束后才发完成事件。
- 防止同一终局被多个入口重复路由。

**验收**

- 事件发布者、payload、消费者、后续状态能逐个对上。
- 同一结果不会因为 `SPIN_COMPLETE` 和 Reel 完成事件先后不同而重复结算。
- 任何动画 callback 未触发时，有日志或超时路径可定位卡点。

### 3.4 Reel / SlotReel / 布局

**必须分开的能力**

1. 服务端布局格式和客户端布局格式。
2. 列数、每列可见行数、隐藏缓冲和实际 SymbolView 数量。
3. 结果索引、列行坐标、世界坐标和特效位置映射。
4. 首次 Spin 停轮与 Cascade/drop 的不同路径。
5. Wild、Scatter、长符号、倍率编码、消除和补牌。
6. Normal、Turbo、急停、Slow Drop 和错误结果的停止行为。

#### 3.4.1 咪牌判定术语

分析 Reel 需求时，必须先定义以下变量，不能只写“有 Scatter 时咪牌”：

| 变量 | 定义 |
| --- | --- |
| `T` | 当前玩法真正触发 Free Spin/Bonus 所需的可见 Scatter 数 |
| `seen(i)` | 普通 Spin 视觉上已经停到第 `i` 列时，`0..i` 列累计可见 Scatter 数 |
| `R` | Cascade 清除后、释放新牌前，仍留在可见盘面的 Scatter 数 |
| `landed` | 本次掉落中已经真实落地的新 Scatter 数；不能预先使用完整新结果中的数量 |
| `startPeekingIndex` | 普通 Spin 第一列咪牌目标列；`0` 通常表示本轮不进入普通咪牌 |

必须区分三个判定：

1. **普通 Spin 咪牌**：通常在 `seen(i) == T - 1` 且仍有下一列未停时开始；项目框架可能通过 `startPeekingIndex` 表达该结果。
2. **掉落 slow-drop 路径**：由 `R` 和项目的 `SLOW_DROP_MIN_SCATTER` 决定；进入 slow-drop 不等于一定显示“再来一个 Scatter”。
3. **Free Spin 达成**：普通停轮使用 `seen(i) >= T`，掉落阶段使用 `R + landed >= T`；都必须用 `>=` 并有单次触发 guard，以覆盖同一列一次出现多个 Scatter 的跳数场景。

#### 3.4.2 普通 Spin 咪牌流程

| 阶段 | 必须处理的逻辑 | 可观察结果 |
| --- | --- | --- |
| 1. 接收结果 | 保存本轮结果，拆成各列可见布局；重置每列 Scatter 快照、咪牌、Free Spin Won、音频和遮罩状态 | 新 Spin 不继承上一轮状态 |
| 2. 开始转动 | 各列进入 spinning；Turbo/急停只能改变节奏，不能改变判定所使用的结果 | Reel 状态和 Spin 状态一致 |
| 3. 单列停轮 | 只累计已停列的可见 Scatter，得到 `seen(i)`；不能直接读取完整结果总数提前判定 | 日志可对出 `reelIndex`、本列数量和累计数量 |
| 4. 判定达成 | 若 `seen(i) >= T`，立即且只触发一次 Free Spin Won；即使同列从 `T-2` 跳到 `T+1` 也不能漏触发 | InfoBoard/Scatter 庆祝和后续 FG 入场状态一致 |
| 5. 开始咪牌 | 未达成且达到 one-more 条件，并且仍有下一列时，目标切到下一列：慢转/光柱、盘面压暗、已有 Scatter 高亮、镜头、riser/heartbeat、ONE_MORE_SCATTER 按项目规则启动 | 咪牌目标列与 `startPeekingIndex` 一致，不提前照亮后续列 |
| 6. 咪牌列停轮 | 播放该列停轮和 Scatter 出现反馈；重新计算 `seen(i)`。未达成且还有下一列则移动目标，达成则进入庆祝，最后一列未达成则退出悬念 | 每列只推进一次，无重复音效或重复消息 |
| 7. 全部停轮 | 关闭遮罩/光柱/慢转，停止循环音效，恢复 BGM、镜头和 Reel 层级；再把控制权交给 Win/Cascade/结算流程 | `AllSpinOver` 后无咪牌残留，下一阶段只进入一次 |

普通 Spin 的关键约束：

- `seen(i)` 必须来自可见 Symbol；隐藏缓冲、预填充符号和尚未停下的列不能提前计数。
- `startPeekingIndex` 是视觉时序，不可代替 Free Spin 达成判定；没有进入咪牌也可能在同一列或最后一列直接达到 `T`。
- Scatter 到达阈值、ONE_MORE_SCATTER、Free Spin Won 是三个独立状态，切换时必须清理前一状态。
- Turbo、急停和自动 Spin 必须复用同一判定数据；允许缩短或跳过动画，不允许漏掉状态重置、FG 触发或完成回调。

#### 3.4.3 Cascade / 掉落咪牌流程

掉落咪牌必须使用“清除后残留盘面”的快照，不能使用下一笔完整布局提前得知新 Scatter：

```text
清除完成
  -> 统计可见残留 Scatter R
  -> 记录各列清除格/待补牌数
  -> R 未达到 slow-drop 门槛：普通掉落
  -> R 达到门槛：暂存新牌，先完成旧符号重力补位
  -> 若 R == T - 1：启动 ONE_MORE、遮罩/光柱、残留 Scatter 心跳
  -> 逐列/逐格释放新牌
  -> 每个新 Scatter 真正落地后 landed += 1
  -> R + landed >= T：只标记/触发一次 Free Spin 达成
  -> 所有列预期新牌都落地
  -> 关闭 slow-drop 表演并发出掉落完成
  -> 进入下一次 Cascade 或最终结算
```

掉落阶段必须保留以下边界：

- `R` 只包含已经落定且清除后仍存在的可见 Scatter；轴顶 pending new symbol、下一结果布局和隐藏缓冲不得计入。
- 先完成旧符号补位，再播放残留 Scatter 心跳并释放新牌；否则 SymbolView、overlay 和目标格会错位。
- 掉落完成要按“每列预期数 vs 已落地数”或等价机制判定，不能因为框架提前发出 `AllDropOver` 就推进 Cascade。
- 新 Scatter 可能同列同时落地，达成条件必须使用 `>= T`，并用 `freeSpinShown/completed` guard 防重复。
- 未达成时，最后一颗新牌落地后要关闭 ONE_MORE、遮罩、心跳和降音量；达成时也必须在 FG 转场接管前完成 Reel 层清理。
- 新一轮 Cascade、新 Spin、Turbo、急停、节点销毁或异常中断，都必须有幂等清理路径。

#### 3.4.4 项目差异与当前证据

| 项目 | 普通 Spin | Cascade / 掉落咪牌 | 需求分析时必须确认 |
| --- | --- | --- |
| YJZR | `YjzrSlotReelMgrHooks` 在 `startPeekingIndex != 0` 且当前停轮已到咪牌前一列时，向下一列开启 `PeekingStart`、遮罩、镜头和 `miRotate`；全部停轮后统一 `PeekingStop` | 清除阶段按每列可见区统计残留 Scatter，记录第 2 个 Scatter 所在列；`R >= 2` 且本 Spin 尚未完成 slow-drop 时武装表演，同一 Spin 只完成一次，`dropOver()` 调用 `finishCascadePeeking()` 收尾 | `GameConfig.scatterTriggerCount=4`，但 `YjzrPerformanceCtrl` 当前以 `T=3`、`ONE_MORE=2` 判定 FG 表演；两者语义/来源存在冲突，计划必须先确认服务端真实规则及框架配置用途，不能任选一个。前端可见行配置当前为 `5/6/6/6/6`，不是可直接泛化的固定 5x6 |
| JDSRY | `T=3`；按已经停下的列累计 `seen(i)`，达到 `>=3` 即切一次 Free Spin Won。咪牌从 `startPeekingIndex-1` 停轮后开始，逐列移动高亮，最后一列结束 | `SLOW_DROP_MIN_SCATTER=2`。`R>=2` 进入 slow-drop；只有 `R==2` 显示 ONE_MORE、降 BGM、残留 Scatter 心跳后再释放新牌，`R>=3` 直接释放。新 Scatter 每次真实落地后累加，`R+landed>=3` 设单次达成 flag；全部列落地计数满足后才继续 | `JdsryReelLayout.ts` 为 5 轴、可见行 `3/4/5/4/3`、19 格、720 ways；compact index、倍率编码和变高行数必须沿用该项目转换，不能套用 YJZR 坐标 |

YJZR 的阈值冲突不是速查表替项目作出的结论，而是 `s_cli` 必须产出的一个显式核对项：响应协议触发条件、服务端 seed、框架 `startPeekingIndex`、InfoBoard/FG 表演阈值必须一致后才能进入实现。

#### 3.4.5 最低验收用例

| ID | 输入/操作 | 通过标准 |
| --- | --- | --- |
| SPIN-01 | `seen(i) < T-1` 且还有后续列 | 不开启咪牌，不出现 ONE_MORE，不改变普通停轮节奏 |
| SPIN-02 | 某列停下后 `seen(i) == T-1`，下一列尚未停 | 下一列才进入咪牌；已有 Scatter 高亮，目标列/遮罩/音频/InfoBoard 同步启动 |
| SPIN-03 | 咪牌列未出现 Scatter，最后仍 `<T` | 移到下一列或在最后一列完整退出；ONE_MORE 不残留到下一 Spin |
| SPIN-04 | 咪牌列出现 Scatter 后累计达到 `T` | 在该列真实停下后只触发一次 Free Spin Won，不提前、不重复 |
| SPIN-05 | 同一列出现多个 Scatter，使累计从 `<T` 跳到 `>T` | 使用 `>=T` 仍能达成；音效、镜头和 InfoBoard 不重复播放 |
| SPIN-06 | 未进入咪牌，但某列/最后一列一次达到 `T` | 仍能触发 Free Spin Won；`startPeekingIndex` 不能成为 FG 判定前置条件 |
| SPIN-07 | 对 SPIN-02 至 SPIN-06 分别执行 Turbo、急停和 Auto Spin | 结果、触发次数和最终状态相同；只允许时长不同 |
| DROP-01 | 清除后 `R` 小于 slow-drop 门槛 | 走普通掉落，不出现 slow-drop 遮罩、心跳或 ONE_MORE |
| DROP-02 | 清除后恰好 `R == T-1`，新牌尚未释放 | 只高亮残留 Scatter；pending 新 Scatter 不得提前出现或计数，旧符号先补位 |
| DROP-03 | `R == T-1`，新牌全部落地后仍 `<T` | 等最后一颗预期新牌落地才结束；恢复 BGM/遮罩/特效并继续正常结算 |
| DROP-04 | 新 Scatter 落地令 `R+landed >= T` | 在该 Scatter 真实落地后只标记/触发一次达成；同列多 Scatter 不漏判、不重入 |
| DROP-05 | `R >= T` 时进入项目定义的 slow-drop 路径 | 不显示错误的 ONE_MORE 悬念；按项目规则直接掉落或播放既定表演 |
| DROP-06 | 多列同时补位和掉落，刻意让最后一列最晚完成 | 最晚列落地前不推进下一 Cascade/结算；无交换位置、空格、overlay 残影 |
| DROP-07 | 连续两次 Cascade 都满足 slow-drop 条件 | 按项目规则验证每 Cascade 或每 Spin 的去重范围；计数、token、callback 不串轮 |
| BOUNDARY-01 | Scatter 位于每列最上/最下可见格、隐藏缓冲、首个 compact index | 只统计可见格；坐标、遮罩和特效都落在正确 Reel/row |
| CLEANUP-01 | 咪牌中急停、切 Turbo、开始新 Spin、退出 FG 或销毁节点 | 循环音效、BGM fade、mask、overlay、camera、tween/schedule 和完成 callback 全部恢复且可重复调用 |

#### 3.4.6 验收证据

Reel/咪牌需求不能只凭静态代码验收。至少保留一组可复现 seed/响应，并同时记录：

- 原始布局、拆列后的可见布局、`T`、`startPeekingIndex`。
- 每列停轮的 `reelIndex`、本列 Scatter 数和 `seen(i)`。
- 每次 `PeekingStart/PeekingStop` 或等价状态、目标列、InfoBoard mode。
- 每次 Cascade 的 `R`、清除格、各列待补牌数、pending/landed 数、新 Scatter 落地时点。
- `AllSpinOver/AllDropOver`、下一次 Cascade、FG 入场或最终结算的先后顺序。
- Normal、Turbo、急停各一段运行时画面/日志；控制台无错误，下一 Spin 无 VFX、音频、遮罩或状态残留。

- 长符号/倍率编码仍需额外验证不会被普通 symbol id 或 Scatter 解析逻辑破坏。

### 3.5 InfoBoard / 跑马灯 / Win / Total Win

InfoBoard 应视为一个小型显示状态机，而不是“一个数字 Label”。常见能力包括：

| 能力 | 输入 | 验收重点 |
| --- | --- | --- |
| 普通跑马灯 | 启动、普通 Idle、Spin 结束 | normal 文案循环，进入 Win 时正确停止/淡出，回 Idle 后可恢复 |
| FG 跑马灯 | `FREE_GAME_START`、FG 中间轮 | 使用 FG 文案，不误用 normal 文案，语言切换后资源刷新 |
| Scatter 提示 | Scatter peeking/slow drop | 触发条件、列/位置、重复触发、被 Win 打断后的清理 |
| Free Spin Won | Scatter 触发完成 | 播放一次，完成 callback 能推进 FG 入场 |
| 单次 Win | frame/cascade win amount + WinType | 金额快照、Win/金额文案、Small/Medium/Big 底板、数字滚动、倍率特效 |
| Total Win | FG 结束或完整 Spin 结算 | total amount、滚动/静态、收集/跳过、退场、BGM/UI 恢复 |
| 模式切换 | 任意显示请求 | 互斥、skip、turbo、打断 callback、旧 tween/schedule/VFX 清理 |

**JDSRY 参考**

`InfoBoardControllerBase` 定义了 `TIPS`、`ONE_MORE_SCATTER`、`FREE_SPIN_WON`、`WIN_AMOUNT`、`TOTAL_WIN_AMOUNT` 等模式；`HbfyInfoBoardController` 还处理底板级别、数字滚动、粒子、倍率/收集 VFX 和语言刷新。

**YJZR 参考**

`InfoboardController`、`InfoboardMessageController`、`TotalWinController` 分担跑马灯/消息、Win 数字和 Total Win 收集流程，不能因为类名不同就认为功能不存在。

**InfoBoard 验收模板**

```text
触发：哪个事件/响应/状态触发？
数据：本次 frame、Spin、Cascade 或 Free Game 的哪一个金额快照？
入口：哪个 switchTo/play/show 方法？
状态：当前 mode，目标 mode，互斥和 skip 规则？
资源：文字、数字、底板、动画、粒子、音频和 Prefab 节点？
时序：开始、滚动、达到目标、被打断、结束 callback？
清理：下一 Spin、0 金额、重复事件、语言切换、节点销毁？
验收：画面、日志、金额、事件、current state 和下一阶段是否一致？
```

### 3.6 BigWin / TotalWin

#### 3.6.1 定义与边界

| 名称 | 定义 | 常见错误 |
| --- | --- | --- |
| `baseBet` | 本次 Spin 的有效总下注；优先使用响应/PlayerData 的 bet amount，必要时才由 `winAmount / winMulti` 回推 | 使用 bet size 代替总下注，导致所有阈值偏移 |
| `ratio` | `finalWinAmount / baseBet`，用于判断 Small/Medium/Big/Mega/Super Mega | 使用固定金额判断，换下注后等级错误 |
| `finalWinAmount` | 当前完整 Spin 在所有 Cascade、倍率收集和终局结果后的最终赢分 | 把单次 Cascade/单帧赢分传给 Popup |
| `targetLevel` | Big Win Popup 最终应到达的等级，例如 BIG=0、MEGA=1、SUPER_MEGA=2 | 数字跨阈值但标题/VFX 没升级 |
| `targetPayout` | Popup 数字滚动必须到达的最终金额 | Skip 后只停动画，没有设置最终值 |
| Big Win Popup | 覆盖游戏主画面的全屏大赢表演：遮罩、标题、数字滚动、等级 VFX、金币、BGM/SFX、Skip 和退场 | 与 InfoBoard 的 BIG 底板/金额显示混为同一组件 |
| InfoBoard Total Win | Popup 退场后的底板与金额交接，也用于未达到 Popup 阈值的普通最终赢分 | Popup 尚未退场就提前播放，或结束后完全漏播 |
| FG Total Win Panel | Free Game 全部结束后的整段累计赢分结算弹窗 | 把单轮 Big Win 当成整段 FG Total Win |

Big Win 判定必须发生在最终赢分已经稳定之后。典型顺序是：

```text
最后一轮 Reel/Cascade 完成
  -> 倍率/特殊奖励收集完成
  -> 取得 finalWinAmount、baseBet、ratio
  -> 未达到 Big Win：InfoBoard Total Win/普通 Win
  -> 达到 Big Win：打开全屏 Popup
  -> Popup 数字滚动和等级升级
  -> 到额 WAITING 或用户 Skip
  -> Popup Dismiss + 清理
  -> InfoBoard Total Win（项目要求时）
  -> callback 一次
  -> Retrigger / FG 结束 / 下一 Spin
```

#### 3.6.2 Big Win Popup 状态机与多级表现

| 状态 | 进入动作 | 允许操作 | 离开条件 |
| --- | --- | --- | --- |
| `INITIAL` | 保存 payout、targetLevel、阈值和当前是否 FG；重置旧 tween/schedule/VFX | 不接受 Skip | BGM 淡出和入场延迟完成 |
| `PLAYING` | 激活全屏 root/遮罩，播放 BIG 起始级别，数字从 0 滚到目标，跨阈值时升级标题与 VFX | Skip 延迟结束后可点击 | 自然滚到目标，或第一次 Skip 直接补齐最终金额/目标等级 |
| `WAITING` | 显示最终金额与高潮效果，主滚分音切到结束音，准备恢复 Normal/FG BGM | 第二次 Skip 延迟结束后可退场 | 等待时间结束，或第二次 Skip |
| `DISMISSING` | 禁用 Skip，播放淡出/退场，停止音频和 VFX，恢复场景 BGM | 不再响应点击 | 退场动画完成后 reset，并执行 callback 一次 |

Popup 必须满足：

- 第一次 Skip 只负责完成数字滚动和等级升级；第二次 Skip 才允许退场。若项目设计是单次 Skip，也必须明确写入需求，不能由实现者猜测。
- Skip、自然完成、自动退场、异常 fallback 可能同时到达，必须用 `state/completed` guard 保证回调只执行一次。
- 达到最终值时必须显示精确金额，不能因浮点、分段 tween 或阈值相等而少一分/少一级。
- Popup 的 root、遮罩、标题、数字、金币、粒子、循环音效、BGM fade、按钮事件和 schedule 都要在 reset/onDestroy 清理。
- 在 FG 内触发 Big Win 时，退场恢复 FG BGM；Normal Spin 则恢复普通 BGM。
- Turbo 可缩短等待，但不能跳过最终值、Dismiss、InfoBoard/Total Win 交接或 callback。
- Popup Controller 缺失、资源加载失败或动画异常时，要走不阻塞结算的 fallback，并仍显示最终金额。

多级大奖必须按资源工程拆成可验收的等级表现：

| 检查项 | 通用规则 |
| --- | --- |
| 弹窗数量 | 先查资源工程。YJZR/JDSRY 是一个 `big_win_controller` 内切换 BIG/MEGA/SUPER_MEGA，不得误做成多个同时叠加的弹窗；只有资源工程明确分成多个 Prefab 时才照搬 |
| 触发时点 | 只在完整 Spin 的 Reel/Cascade、倍率和特殊奖励全部稳定后判级；FG 单轮 Big Win 与 FG 最终累计结算分开 |
| 等级升级 | 从资源工程定义的起始等级播放，滚分跨阈值时同步切标题、动画、VFX、金币和音效；Skip 必须直接补齐最终金额及 `targetLevel` |
| 等级资源 | 每一级都核对标题 atlas/字体、数字字体、动画 clip、VFX、BGM/SFX 和本地化资源；不能用普通 Label 或近似样式代替 |
| Scene 层级 | 保持资源工程的父节点路径、Sibling 顺序和遮罩层级；Popup 位于 Reel/GamePanel/InfoBoard 之上，`total_win_controller` 仍为独立结算节点 |
| 互斥与复位 | 任一时刻只允许一个大奖 Popup root 生效；切级不重复派发 callback，退场后所有等级 holder、音效、VFX 和输入监听恢复初始状态 |

#### 3.6.3 项目差异与当前证据

| 项目 | 判级 | Popup 流程 | 退场后交接 |
| --- | --- | --- | --- |
| YJZR | 当前 fallback 倍率为 Medium `3x`、Big `5x`、Mega `15x`、Super Mega `35x`；先从响应 bet amount 或 betSize x betLevel x betWays 取得 `baseBet` | `BigWinController` 包含 BIG/MEGA/SUPER_MEGA、分段滚分、0.5 秒后开放首次 Skip、到额后可 Skip/自动退场和 Normal/FG BGM 恢复；`playBigWinPresentation()` 使用 `completeOnce` 防重复 | Popup 成功或 fallback 后调用 `showInfoboardTotalPayout(..., suppressBigBoard=true)`，避免再重复播放 Big 底板升级；之后才进入 `onRoundEnd` |
| JDSRY | Small `<2.5x`、Medium `2.5x..5x`、Big `5x..15x`、Mega `15x..35x`、Super Mega `>=35x` | `BigWinControllerBase` 明确为 `INITIAL -> PLAYING -> WAITING -> DISMISSING`；PLAYING 首次 Skip 到最终值，WAITING 二次 Skip 退场，或 6 秒自动退场 | Popup 完整 Dismiss 后切 `TOTAL_WIN_AMOUNT`，保持 BIG 底板但跳过重复等级动画；InfoBoard callback 完成后再推进，并在当前实现额外保留 1 秒 Prize 收尾 |

阈值属于项目/服务端配置，不得把 YJZR 或 JDSRY 的数值写死成所有新项目的默认规则。分析计划必须写出阈值来源、金额基准和边界值归属。

#### 3.6.4 最低验收用例

| ID | 输入/操作 | 通过标准 |
| --- | --- | --- |
| BW-01 | `ratio` 刚低于 Big 阈值 | 不打开 Popup，仍完成普通/Medium/InfoBoard Total Win 路径 |
| BW-02 | `ratio` 分别等于 Big、Mega、Super Mega 边界 | 等号归属正确，Popup 最终等级和标题正确 |
| BW-03 | 相同赢分、不同 bet amount | 按 `ratio` 得到不同等级，证明没有用固定金额判级 |
| BW-04 | 有多次 Cascade/倍率收集 | Popup 使用最终完整赢分，不使用中间 frame 金额 |
| BW-05 | 自然播放至结束 | 数字逐段到精确目标，跨级 VFX 顺序正确，WAITING 后自动退场 |
| BW-06 | PLAYING 中点击 Skip | 数字立即到最终值，标题跳到 targetLevel，只进入一次 WAITING，不直接消失 |
| BW-07 | WAITING 开放后再次点击 Skip | 只执行一次 Dismiss/callback，所有音频、遮罩和按钮事件清理 |
| BW-08 | 在 FG 内和 Normal 各触发一次 | 退场分别恢复 FG/Normal BGM，背景和控制面板状态不串模式 |
| BW-09 | Popup Controller/动画资源不可用 | 记录错误并 fallback 到最终金额显示，结算不被卡住 |
| BW-10 | Popup 退场后进入 InfoBoard Total Win | 两层显示不重叠、不重复升级；最终金额一致，完成前不进入下一 Spin |
| BW-11 | 连点 Skip、自动退场与动画 callback 同帧发生 | callback、余额套用、Retrigger/round end 都只执行一次 |
| BW-12 | Popup 中销毁节点、切场景或异常中断 | 无残留 BGM/SFX、VFX、遮罩、tween、schedule 和输入监听 |
| BW-13 | 分别触发 Big、Mega、Super Mega | 标题、字体、数字、动画、VFX、音效按资源工程逐级对应；同一时刻只有一个等级 holder/Popup 生效 |
| BW-14 | 打开 Popup 并检查运行时 Scene | 父节点路径、Sibling 顺序、遮罩覆盖、输入拦截和 `total_win_controller` 的独立层级均与资源工程一致 |

#### 3.6.5 验收证据

- 记录 `finalWinAmount`、`baseBet`、`ratio`、各等级阈值、`targetLevel` 和金额来源。
- 记录 Popup `INITIAL/PLAYING/WAITING/DISMISSING` 转换、Skip 点击阶段和 callback 次数。
- 保存 Big/Mega/Super Mega 边界 seed/响应及运行时画面，核对本地化标题、数字、遮罩和 VFX。
- 记录 Popup、InfoBoard Total Win、Retrigger/FG Exit/round end 的先后顺序。
- 验证 Normal/FG BGM 恢复，以及下一 Spin 不残留 Popup 节点、音频、按钮或金额。
- 保存资源工程与目标工程的 Popup Scene 路径、Sibling 顺序、组件绑定、各等级 holder/clip/font/atlas 对照。

### 3.7 Free Game / Bonus / Retrigger / Restore

#### 3.7.1 定义与状态

| 名称 | 定义 |
| --- | --- |
| FG Trigger | Normal Spin 的最终结果确认获得免费次数；Scatter 数只是一项校验，真正次数和模式必须以服务端响应为准 |
| `initialCount` | 正常进入 FG 时服务端授予的初始次数 |
| `remainingBefore/remainingAfter` | 当前 FG Spin 前后服务端剩余次数；字段名可能是 `bsc/sc`、`spinChance` 等 |
| `addedCount` | Retrigger 本轮真实增加的次数，不能只从画面 Scatter 数或计数器差值猜测 |
| `totalAwardedCount` | 初始次数加所有 Retrigger 增量，用于部分 Total Win 面板显示“共获得 N 次” |
| FG Round | 一次免费 Spin 及其全部 Cascade、倍率、Win 和结算表演；不是单个响应 frame |
| Retrigger | 已在 FG 中再次获得免费次数；不会重新走完整 Normal -> FG 入场 |
| Restore | 断线重连/刷新后根据最后结果恢复 FG 状态、盘面、剩余次数和累计值；不是新触发 |
| FG Total Win | 整段 Free Game 的累计赢分结算；与某一轮 Big Win/Total Win 不同 |

夺宝（Scatter/Bonus）达到 2 个以上时必须进入触发矩阵，但不能把“2 个”直接写死为所有项目的 FG 进入门槛：

- `0/1/2/实际门槛/超过门槛` 都要有 seed 或响应。2 个常见含义是 ONE_MORE、咪牌或掉落咪牌起点；是否直接进入 FG 必须由资源工程表现、服务端次数字段和最终响应共同确认。
- 当前 JDSRY 的实际 FG 门槛为 3；YJZR 表现代码使用 3、配置另有 4 的冲突证据。Agent 必须把冲突列为阻塞核对项，不能根据“通常 2 个以上”自行选择。
- 服务端已经授予免费次数时，前端必须进入 FG；只看到足够图标但服务端未授予时，记录协议/资源不一致，不由客户端伪造次数。

建议将 Free Game 明确为以下状态：

```text
NORMAL
  -> TRIGGER_CELEBRATION
  -> BONUS_LOADING_ENTER
  -> SWITCH_UI_BEHIND_PANEL
  -> BONUS_LOADING_EXIT / START_PANEL
  -> FG_ACTIVE
  -> RETRIGGER（可重复）
  -> FG_SETTLING
  -> FG_TOTAL_WIN
  -> FG_EXIT
  -> NORMAL

断线恢复：RESTORE -> FG_ACTIVE
```

#### 3.7.2 Scene 资源层级、专用界面与命名

Free Game 不是只切一个 `isFG`。需求拆解必须逐项找到资源工程中的专用节点，并按原父节点路径、Sibling 顺序、坐标、尺寸、active 初值和组件引用放入目标 Scene：

| 职责 | 常见资源/节点 | Scene 与表现要求 |
| --- | --- | --- |
| 入场 Loading | `bonus_loading_controller`；历史工程也要搜索 `bouns_*` | 位于 Reel、InfoBoard 和操作区之上，能够遮住切换过程并拦截输入；保留资源工程的入场、停留、退场和两阶段 callback |
| FG 转盘背景 | `bonus_background_controller`、`background_controller/bonus_bg` | 放在资源工程指定的 Reel 背景层；Loading 遮挡期间切换，不能盖住 Symbol 或错误留在 Normal |
| FG 转盘前景 | `bonus_foreground_controller`、`foreground_controller/bonus_ui` | 保持资源工程相对 Reel、VFX、InfoBoard 的前后顺序，不得因重挂父节点改变遮罩和坐标 |
| 次数/重触发 | `free_spin_controller`、`freespin_remaining_controller`、Retrigger/Start Panel | 显示初始、剩余和新增次数；数字、标题、动画与服务端字段同步，Normal/Restore/Exit 状态正确 |
| FG InfoBoard | `infoboard_controller` 的 FG tips/message/holder | 有独立的 ONE_MORE、FREE SPIN WON、剩余次数、FG Win/Total Win 词条；字体、atlas、描边、字号和语言切换以资源工程为准 |
| 最终结算 | `total_win_controller` 或资源工程的 FG Payout Panel | 位于游戏层之上的独立结算界面，显示整段 FG 累计赢分及资源工程要求的总授予次数；不得复用单轮 Big Win 金额 |

命名只用于发现资源，不用于猜测实现：

- 成品工程常见正确拼法是 `bonus_*`；旧资源可能使用 `bouns_*`。扫描时两种都查，落地时原样保留资源工程的 Prefab、节点名、UUID、组件类和属性引用，不擅自纠正拼法。
- 资源存在不等于已接入。必须确认 Prefab 实例已放入 Scene、Controller 属性已绑定、运行时会切 active/opacity，并且入场、Restore、Retrigger、结算和退出都能到达。
- Scene 层级必须从资源工程的 Scene/Prefab 实例取证，不能仅凭文件名把所有 Bonus 节点统一挂到 Canvas 根节点。
- FG 专用字体和词条必须核对真实 font/atlas/i18n 路径及中英文画面；禁止用系统字体、临时文字或 Normal InfoBoard 词条替代。

#### 3.7.3 正常入场流程

| 阶段 | 必须处理的逻辑 | 完成条件 |
| --- | --- | --- |
| 1. 确认触发 | 等当前 Reel、Cascade、Scatter Win 和本轮结算到达允许切换的状态；读取服务端免费次数 | FG Start 只派发一次 |
| 2. Scatter 庆祝 | Scatter Win/Free Spin Won、镜头、音效和 InfoBoard；保存本轮 token 防旧 callback 串轮 | 庆祝 callback 或项目定义延迟完成 |
| 3. BonusLoading 入场 | 停/淡出 Normal BGM，播放转场音和 FG BGM，显示次数及本地化标题 | 面板已经遮住主画面 |
| 4. 背后切换 | 在面板遮挡期间切 FG 背景、InfoBoard、倍率板、footer、ControlPanel、Feature Buy、Remaining 面板和 `isFG` | `onPanelReady` 完成，用户看不到 UI 跳变 |
| 5. BonusLoading 退场 | 关闭遮罩/Loading；项目有 Start Panel 时等待其按钮或自动回调 | `onClose`/Start Panel callback 完成 |
| 6. 首轮 Spin | 只调用一次真实 Spin action；不能同时由 BonusLoading 和 Start Panel 各触发一次 | 出现唯一一笔 FG Spin 请求 |

BonusLoading 必须有两个语义不同的完成点：

- `onPanelReady`：面板已遮住画面，可安全切换背后 UI。
- `onClose`：面板已经退场，才可进入倍率入场或首轮 Spin。

只有一个 `show complete` callback 的项目，也必须在计划中说明它对应哪一个完成点，以及另一个时点如何保证。

#### 3.7.4 FG 每轮与次数

1. Spin 开始前保存服务端/本地显示快照，防止异步 callback 读取下一帧数据。
2. 剩余次数的扣减时机按项目 UI 设计执行，但最终显示必须与服务端 `remainingAfter` 一致。
3. 一次 FG Round 的全部 Cascade、倍率和 Win 表演完成前，不能请求下一次 FG Spin。
4. Auto/Turbo 只能改变节奏；FG 是否强制关闭 Turbo、是否自动继续，必须是项目明确规则。
5. Footer/InfoBoard 若显示累计赢分，应使用整段 FG 累计字段；单轮中奖仍使用本轮最终金额。
6. 最后一轮以服务端状态判定，不能只依赖计数器动画显示为 0。

#### 3.7.5 Retrigger 流程

```text
FG Round 最终结果
  -> 从服务端前后次数计算/读取 addedCount
  -> 校验 addedCount > 0，必要时再校验 Scatter/Bonus 条件
  -> 暂存 addedCount 和新目标次数
  -> 当前轮 Win/Total Win 完成
  -> 并行播放 Retrigger 面板与 Remaining +N 计数动画
  -> 两条 callback 都完成
  -> 清 pending retrigger
  -> 继续下一 FG Round
```

Retrigger 必须满足：

- `addedCount` 使用服务端真实增量。JDSRY 当前终局计算为 `remainingAfter - remainingBefore + 1`，因为终局结果已扣掉本轮一次；该公式不能泛化到协议字段语义不同的项目。
- Scatter 达标可作为协议一致性校验，但不能替代服务端增加次数。
- Retrigger 面板与计数器通常并行，必须建立完成屏障；任一未完成都不能提前继续。
- 同一 pending retrigger 只消费一次；播放前或完成后要清零，避免在 `onRoundEnd` 重播。
- `totalAwardedCount` 应累加服务端真实 `addedCount`，不能误用视觉计数器当前差值。

#### 3.7.6 结束与 Restore

**FG 结束：**

1. 等最后一轮所有 Reel/Cascade、Multiplier、Big Win 和单轮 Total Win 完成。
2. 冻结下一 Spin，停止 FG 临时 VFX/循环音效，隐藏 Remaining 面板。
3. 按项目顺序播放倍率合并、FG Total Win/收集面板；`totalWin=0` 也必须有直接完成路径。
4. Total Win callback 完成后恢复 Normal 背景、InfoBoard、footer、ControlPanel、Feature Buy 和按钮状态。
5. FG BGM、Total Win BGM、Normal BGM 的切换不能互相覆盖；确认退场完毕后再派发 FG End/round complete。

**Restore：**

- 直接设置 FG active、剩余次数、FG UI/BGM、倍率、盘面和累计显示，不重播 Scatter 庆祝、BonusLoading 或 Start Panel。
- 使用恢复响应中的布局设置 Reel，不能自动发一笔“首轮 FG Spin”。
- `remainingCount` 是剩余次数，不一定等于最初总次数；服务端没有总次数时，Total Win 文案需定义 fallback。
- Restore 完成事件只在所有必要 UI/布局状态就绪后派发一次。

#### 3.7.7 项目差异与当前证据

| 项目 | 正常入场 | Retrigger / 结束 | Restore |
| --- | --- | --- | --- |
| YJZR | `FREE_GAME_START` 设置 `isFreeGame`、切 FG 跑马灯、隐藏 Feature Buy；`BonusLoadingController.show()` 后打开 FG Start Panel，面板 callback 才执行真实 `spin` | 最后一轮当前顺序为 Multiplier Combine -> InfoBoard Total Payout -> `endFg()` -> FG Payout Panel -> Normal UI/round end | `LAST_SPIN_RESTORE` 检查 `result.isFree`，调用 `restoreFG(spinChance)`、切 FG InfoBoard、恢复倍率与 Reel 布局，然后发送 restore complete；不走正常入场 |
| JDSRY | `FreeGameControllerBase` 明确使用两阶段 BonusLoading：`onPanelReady` 切背后 UI，`onClose` 执行首轮 Spin；FG BGM 与转场同步开始 | Retrigger 面板和 Remaining +N 并行，二者完成才继续；FG End 打开 Total Win，0 赢分直接 callback，Normal BGM 在 Total Win 真结束后恢复 | `restoreFreeGame(remainingCount)` 直接设置 `_isFG`、FG UI、Remaining、背景/Footer 和 FG BGM；当前资源还需保证 `free_spin_controller` active 与次数同步 |

#### 3.7.8 最低验收用例

| ID | 输入/操作 | 通过标准 |
| --- | --- | --- |
| FG-01 | Normal 最终结果触发免费次数 | Scatter 庆祝、FG Start 各一次；未到终局前不提前切场 |
| FG-02 | 正常 BonusLoading 入场 | 面板遮住后才切背后 UI，退场前不露出半套 Normal/FG 混合界面 |
| FG-03 | BonusLoading + Start Panel 完成 | 只产生一笔首轮 FG Spin 请求，按钮/自动回调不重复提交 |
| FG-04 | 连续执行多个 FG Round | 每轮剩余次数、服务端字段、面板显示和实际请求次数一致 |
| FG-05 | FG Round 含多次 Cascade/Big Win | 全部表演完成后才扣/更新次数并进入下一轮 |
| FG-06 | 服务端增加 `+N` 次 Retrigger | 使用真实增量；面板和计数器并行完成后才继续，总授予次数累计正确 |
| FG-07 | Scatter 达标但服务端未增加次数，或次数增加但 Scatter 不符 | 记录协议异常，不凭画面伪造次数，也不重复 Retrigger |
| FG-08 | 最后一轮有赢分及倍率合并 | 顺序为最后表现 -> 倍率/单轮结算 -> FG Total Win -> Exit；金额不混用 |
| FG-09 | FG 总赢分为 0 | 不打开空的 Total Win 弹窗，仍完整恢复 Normal UI/BGM 并结束 |
| FG-10 | FG 中刷新/断线后 Restore | 不播放正常入场、不自动 Spin；盘面、剩余次数、倍率、背景、InfoBoard 和 BGM 一次恢复正确 |
| FG-11 | Restore 响应剩余次数为 1/0/缺失 | 按协议定义处理边界，不显示负数、不误触发新 FG 或重复退出 |
| FG-12 | FG 内触发 Big Win 后结束 | Popup 恢复 FG BGM；真正 FG Exit 后才恢复 Normal BGM |
| FG-13 | FG 中切语言、Turbo、Auto 或急停 | 本地化资源更新，状态与次数不变，不破坏 callback 链 |
| FG-14 | 退出后立即开始 Normal Spin | Feature Buy、ControlPanel、InfoBoard、footer、背景、倍率和按钮均已恢复，无 FG VFX/SFX 残留 |
| FG-15 | 分别输入 0、1、2、实际门槛和超过门槛个夺宝 | 2 个时按资源工程进入 ONE_MORE/咪牌或 FG；实际门槛与服务端授予次数一致，不提前、不漏触发 |
| FG-16 | 正常入场并检查运行时 Scene | Loading、FG 背景/前景、次数面板、InfoBoard、Start/Payout/Total Win 的父节点、Sibling 顺序、active 和组件引用均与资源工程一致 |
| FG-17 | Loading 遮挡期间切换 FG 转盘背景与前景 | 主画面不露出半套 Normal/FG UI；Loading 拦截输入，退场后 Reel、Symbol、VFX 的前后层级正确 |
| FG-18 | FG 中切换中英文并触发 ONE_MORE、FREE SPIN WON、次数和 Total Win | 使用资源工程对应词条、font/atlas、描边和字号；无缺字、系统字体替代或 Normal 文案串入 |
| FG-19 | 最后一轮含单轮 Big Win 后进入最终结算 | 先完成单轮大奖，再显示独立 FG Total Win/Payout Panel；金额、总次数、BGM 和退出 callback 不混用 |
| FG-20 | 资源工程含 `bonus_*` 或 `bouns_*` 命名 | 两种拼法都能被盘点；目标 Scene 保留资源工程原名、UUID、组件绑定和引用，不因重命名导致失联 |

#### 3.7.9 验收证据

- 保存 Normal 触发、普通 FG Round、Retrigger、最后一轮、0 赢分、Restore 六类可复现 seed/响应。
- 记录 `isFree/isFinished/isSpinFinished`、初始/前后剩余次数、`addedCount`、累计次数和总赢分字段。
- 记录 `FREE_GAME_START/LAST_SPIN_RESTORE/FREE_GAME_END` 或等价事件，以及 BonusLoading 两阶段 callback、首轮 Spin 请求和完成事件顺序。
- 运行时核对 BonusLoading、Remaining、Start/Payout Panel、InfoBoard、ControlPanel、Feature Buy、背景/Footer/倍率节点的 active/opacity/数值。
- 核对 Normal/FG/BigWin/TotalWin BGM 切换、控制台错误和 callback 次数；FG 结束后的下一笔 Normal Spin 必须可操作。
- 保存资源工程与目标工程的 Scene 节点路径、Sibling 顺序、Prefab/UUID/组件属性绑定，以及 `bonus_*`/`bouns_*` 搜索结果。
- 保存 FG Loading、转盘背景/前景、InfoBoard 专用词条与字体、最终结算界面的中英文运行时画面。

### 3.8 GamePanel / Spin / Bet / Auto Spin / Feature Buy

**常见能力**

- Idle、Spinning、Stopped、AutoSpin、FreeGame、FeatureBuy 等按钮/面板状态。
- Spin 点击、Host/Spacebar 触发、点击防重、急停和 Turbo。
- Bet size/level/ways picker、余额不足、最大下注和下注配置加载。
- Auto Spin 次数选择、开始、剩余次数、停止、完成和异常停止。
- Feature Buy 打开、关闭、确认、下注金额变更和购买请求。
- `CustomControlPanelView`、`CustomInfoBarView`、`CustomBetPanelView` 下的按钮颜色必须与资源工程颜色对齐；normal、pressed、disabled 等状态以资源工程 Prefab/材质为准。

**验收**

- UI 状态与 GameState/Service 状态一致，不以按钮外观代替真实状态。
- Spin 请求未完成时不能重复提交；Auto Spin 停止不会取消正在结算的结果。
- 下注变化会同步请求参数、界面显示和余额校验。
- Feature Buy 的开关、确认和结果展示不影响普通 Spin 与 Last Spin 恢复。
- 验收上述三个 View 时，同时核对按钮各状态颜色与资源工程一致，不得只验证点击逻辑或用代码中的近似颜色替代资源证据。

### 3.9 Resource / Prefab / Scene / Audio / i18n

**通用检查对象**

- 代码 `@property` 类型与 Prefab Component 类型。
- Prefab 节点名称、层级、路径和运行时 `active` 状态。
- Bonus/Free Game 资源同时搜索 `bonus_*` 与 `bouns_*`，并保留资源工程原命名及 Scene 层级。
- SpriteFrame、SpriteAtlas、Spine、AnimationClip、AudioClip 的真实路径。
- `.meta`、UUID、Prefab 实例和脚本 class ID。
- 多语言 atlas、动态加载 fallback、语言切换刷新。
- Animation、Tween、schedule、粒子系统和音效的停止/重置。

**当前项目资源组织**

| 项目 | 资源根 | 典型功能资源 |
| --- | --- | --- |
| YJZR | `assets/resources/yjzr_res/prefab`、`assets/resources/VFX` | `infoboard_controller`、`big_win_controller`、`total_win_controller`、`bonus_loading_controller`、`fs_ui_controller`、`multiplier_*`、`slow_drop_*` |
| JDSRY | `assets/resources/jdsry_res/load_res`、`assets/resources/prefab`、`assets/resources/shared` | `infoboard_controller`、`big_win_controller`、`total_win_controller`、`bonus_loading_controller`、`freespin_remaining_controller`、`multiplier_controller`、`scatter_effect_controller` |

资源目录不同不代表功能不同；功能是否存在要同时看脚本入口、Prefab 绑定和调用方。

## 四、通用需求拆解格式

需求分析 Agent 针对任何 Slot 功能都应生成以下记录：

```text
模块：
能力：
不包含：
触发条件：
涉及场景/状态：
输入数据与快照来源：
服务/API/事件入口：
状态变化与互斥关系：
影响脚本：
影响 Prefab/Scene/资源：
动画/音频/延时/callback：
普通 Spin 路径：
Auto Spin 路径：
Cascade/Drop 路径：
Free Game/Bonus 路径：
FG 触发矩阵（0/1/2/实际门槛/超过门槛）：
FG Scene 层级（Loading/转盘背景/前景/次数/InfoBoard/最终结算）：
FG 专用词条、font/atlas 与语言：
Big Win 等级、阈值、Scene 层级与各级资源：
Last Spin/异常路径：
清理与恢复：
验证命令：
运行时验收：
禁止假设：
资源工程路径：
资源工程功能入口：
资源工程 Prefab/Scene/动画/音频：
行为对照（source -> target -> adaptation）：
资源工程未覆盖项：
允许的兼容差异：
```

### 按问题类型定位

| 需求描述 | 首先查 | 然后查 | 最终验收 |
| --- | --- | --- | --- |
| 金额显示错误 | API types/mapper、GameService | Performance、InfoBoard/TotalWin | raw amount -> display amount -> next state |
| 跑马灯不显示/错文案 | InfoBoard mode、Tips controller | Prefab 节点、atlas、语言刷新、打断清理 | normal/FG/Scatter/Win 切换和重复事件 |
| Reel 错位/符号错误 | layout helper、result mapping | ReelView/Logic、mask、坐标和特效 | 边界位置、首轮、drop、Cascade、Turbo |
| 免费游戏卡住 | GameService hooks、FREE_GAME 事件 | BonusLoading、FreeGame、Remaining、TotalWin | 触发、入场、每轮、retrigger、结束、恢复 |
| BigWin/TotalWin 不结束 | Performance 结算路由 | 动画 callback、skip、dismiss、音频 | 回调只执行一次，下一 Spin 可用 |
| Spin 按钮状态错误 | GameState、GamePanel action | SpinButton、AutoSpin、FeatureBuy | 点击防重、急停、AutoSpin、异常恢复 |
| Prefab 运行时报错 | 脚本 `@property` 与 class ID | Prefab 节点/资源/UUID/meta | 实例化、绑定、启用、销毁和重新启用 |

## 五、项目差异警告

以下内容必须作为当前项目事实重新确认：

- Reel 数量、可见行数、Ways/Cluster/Payline 规则。
- Scatter 触发数量、Wild 可出现列、Multiplier 计算方式。
- `rl`、`ptbr`、`snwm`、`d`、`fwa` 等接口字段的实际含义。
- Free Game 进入条件、免费次数、Retrigger、购买倍数和结算金额。
- BigWin 阈值、TotalWin 收集方式、InfoBoard 显示优先级。
- Prefab 资源根、节点命名、脚本 class ID、UUID 和 Bridge 版本。

## 六、扫描证据索引

### YJZR

- `assets/scripts/Bootstrap.ts`
- `assets/scripts/services/GameService.ts`
- `assets/scripts/types/GameTypes.ts`
- `assets/scripts/api/types/SpinApi.ts`
- `assets/scripts/ui/YjzrPerformanceCtrl.ts`
- `assets/scripts/custom/GamePanel/YjzrSlotReelHooks.ts`
- `assets/scripts/custom/GamePanel/YjzrNaturalDropSlotReelLogic.ts`
- `assets/scripts/yjzr/InfoboardController.ts`
- `assets/scripts/yjzr/InfoboardMessageController.ts`
- `assets/scripts/yjzr/TotalWinController.ts`
- `assets/scripts/yjzr/BigWinController.ts`
- `assets/scripts/data/YjzrResourcePath.ts`
- `assets/resources/yjzr_res/prefab/`
- `assets/resources/VFX/prefab/`

### JDSRY

- `assets/scripts/Bootstrap.ts`
- `assets/scripts/services/GameService.ts`
- `assets/scripts/types/GameTypes.ts`
- `assets/scripts/api/types/SpinApi.ts`
- `assets/scripts/shared/base/PerformanceCtrlBase.ts`
- `assets/scripts/ui/HbfyPerformanceCtrl.ts`
- `assets/scripts/shared/base/InfoBoardControllerBase.ts`
- `assets/scripts/ui/HbfyInfoBoardController.ts`
- `assets/scripts/ui/InfoboardTipsController.ts`
- `assets/scripts/shared/base/FreeGameControllerBase.ts`
- `assets/scripts/ui/HbfyFreeGameController.ts`
- `assets/scripts/data/JdsryReelLayout.ts`
- `assets/scripts/data/HbfyResourcePath.ts`
- `assets/resources/jdsry_res/load_res/`
- `assets/resources/prefab/`

## 七、结论

两个成品项目共同证明：Slot 客户端的通用能力不是“Spin + Reel + 一个 UI”，而是交易、事件状态、表现编排、Reel 映射、InfoBoard/Win、Free Game、控制面板和资源绑定之间的完整链路。

因此 `s_cli` 的需求分析 Agent 必须先产出模块能力矩阵，再产出代码计划；分析模型按模块路由，直接 Reel 能力及任何 Free Game/Bonus 相关处理使用 `sol`，其他能力默认使用 `terra`。`luna` 只能按能力项和验收项执行，不能按模糊的控制器名称猜测修改范围。

无论路由到 `terra` 还是 `sol`，都必须先通过资源工程对照 Gate；`luna` 只能执行已有资源工程证据支持的目标工程适配，不能自行新增、优化或重排玩法与表现。
