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
| Reel / SlotReel | `terra` | 结果布局、停轮、符号显示、Wild/Scatter、长符号、坐标、消除/下落 | `CustomSlotReel*`、布局 helper、Reel hooks | 每个位置映射正确，停轮/下落/遮罩/特效无错位 |
| Performance | `terra` | 把结果事件编排成视觉生命周期 | `*PerformanceCtrl.ts`、`PerformanceCtrlBase.ts` | 普通 Spin、Cascade、Free Game、BigWin、TotalWin 的顺序和回调完整 |
| InfoBoard | `terra` | 跑马灯、Win、Total Win、Scatter/FG 提示、底板、倍率和清理 | `Infoboard*`、`InfoBoardControllerBase`、InfoBoard Prefab | 文案/金额/模式/动画/回调/清理正确 |
| Win / Payout | `terra` | 中奖高亮、金额滚动、符号派彩、Wild/Scatter 特效 | `Win*`、`Payout*`、`Symbol*` | 中奖位置、金额、特效顺序和结束回调一致 |
| BigWin / TotalWin | `terra` | 大赢等级、全屏动画、总赢滚动、收集/跳过/退场 | `BigWin*`、`TotalWin*`、对应 Prefab | 阈值、金额、音效、跳过、结算和下一 Spin 清理正确 |
| Free Game / Bonus | `terra` | 触发、入场、BonusLoading、FG UI、剩余次数、Retrigger、退出结算 | `FreeGame*`、`BonusLoading*`、`Remaining*` | 进入/恢复/重触发/结束/TotalWin/回普通 UI 的链路完整 |
| 特有玩法 | `terra` | Cascade、倍率、Respin、Slow Drop、Ways、Feature Buy 等 | 当前项目专属 hooks/controllers/config | 只按当前项目协议验收，不套用另一个项目的玩法参数 |
| Resource / Prefab | `terra` | Scene 节点、Component、UUID/meta、Prefab、Sprite/Spine/Animation/Audio | `assets/resources`、Prefab 文本、资源路径常量 | 绑定存在、类型正确、资源可加载、启用/禁用时机正确 |

模型列表示默认路由。转盘相关混合需求，只要涉及 Reel/SlotReel/布局能力，或涉及 Free Game/Bonus 的触发、入退场、专用 UI/资源、Retrigger、Restore、单轮 Big Win、最终结算及其关联链路，整次需求统一使用 `terra`；其他需求也默认使用 `terra`。

## 三、按需功能切片

先读本索引，再按需求加载对应 reference。跨域需求只读取直接相关的切片；资源工程证据、项目差异和通用拆解格式仍以本文件为准。

| 需求关键词 | 按需加载 | 默认模型 |
| --- | --- | --- |
| 启动、Loading、Host、Bridge、ExternalModules | `bootstrap-and-bridge.md` | `terra` |
| GameService、API、Mapper、交易、金额、Last Spin、Auto Spin | `game-service-api.md` | `terra` |
| 事件、状态、Performance、时序、callback、结算编排 | `event-state-performance.md` | `terra` |
| Reel、SlotReel、布局、停轮、Scatter、peeking、掉落、Cascade | `reel-and-layout.md` | `terra` |
| InfoBoard、跑马灯、Win、提示、语言刷新 | `infoboard-win.md` | `terra` |
| BigWin、TotalWin、阈值、跳过、收集、退场 | `bigwin-totalwin.md` | `terra` |
| Free Game、Bonus、Retrigger、Restore、FG 入退场/次数 | `free-game-bonus.md` | `terra` |
| GamePanel、Spin、Bet、Turbo、Stop、Control、Feature Buy | `controls-and-spin.md` | `terra` |
| Prefab、Scene、资源、UUID、meta、Audio、i18n | `resource-prefab-scene.md` | `terra` |

切片只用于定位、拆解和验收，不是行为来源；匹配资源工程后，仍需按当前项目的真实代码、Prefab/Scene 和运行时证据确认。

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

因此 `s_cli` 的需求分析 Agent 必须先产出模块能力矩阵，再产出代码计划；分析模型按模块路由，转盘能力及任何 Free Game/Bonus 相关处理统一使用 `terra`，其他能力也默认使用 `terra`。`luna` 只能按能力项和验收项执行，不能按模糊的控制器名称猜测修改范围。

无论使用默认的 `terra` 还是上层明确指定的 `sol`，都必须先通过资源工程对照 Gate；`luna` 只能执行已有资源工程证据支持的目标工程适配，不能自行新增、优化或重排玩法与表现。

