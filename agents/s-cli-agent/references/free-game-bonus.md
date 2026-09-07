### 3.7 Free Game / Bonus / Retrigger / Restore

#### 3.7.1 定义与状态

本文件只提供 Free Game/Bonus 的取证问题、状态覆盖和验收维度。术语、状态图与阶段表是分析清单，不代表目标游戏一定存在对应节点、面板、阶段或顺序；真实门槛、次数语义、资源层级、callback 和时序只能由目标项目的 `{gameId}_res`、`doc/js_scripts` 与协议/运行时证据确认。`doc/project_info.md` 只确认 gameId 与竞品网址身份，不是外部取证入口。

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

- `0/1/2/实际门槛/超过门槛` 都要有 seed 或响应。2 个常见含义是 ONE_MORE、咪牌或掉落咪牌起点；是否直接进入 FG 必须由本地 `{gameId}_res`/`doc/js_scripts` 行为、服务端次数字段和最终响应共同确认。
- 如果资源表现、旧脚本条件、配置与服务端授予结果不一致，必须逐项记录本地来源并标记 `CONFLICT`；在协议和运行时证据消除冲突前，不能自行选择门槛。
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

Free Game 不是只切一个 `isFG`。需求拆解必须逐项找到 `assets/resources/{gameId}_res/` 中的专用节点，并按本地 Prefab 的父节点路径、Sibling 顺序、坐标、尺寸、active 初值和组件引用放入目标 Scene：

| 职责 | 常见资源/节点 | Scene 与表现要求 |
| --- | --- | --- |
| 入场 Loading | `bonus_loading_controller`；`{gameId}_res` 内也要搜索 `bouns_*` | 位于 Reel、InfoBoard 和操作区之上，能够遮住切换过程并拦截输入；保留本地竞品参考的入场、停留、退场和两阶段 callback |
| FG 转盘背景 | `bonus_background_controller`、`background_controller/bonus_bg` | 放在本地 Prefab 指定的 Reel 背景层；Loading 遮挡期间切换，不能盖住 Symbol 或错误留在 Normal |
| FG 转盘前景 | `bonus_foreground_controller`、`foreground_controller/bonus_ui` | 保持本地 Prefab 相对 Reel、VFX、InfoBoard 的前后顺序，不得因重挂父节点改变遮罩和坐标 |
| 次数/重触发 | `free_spin_controller`、`freespin_remaining_controller`、Retrigger/Start Panel | 显示初始、剩余和新增次数；数字、标题、动画与服务端字段同步，Normal/Restore/Exit 状态正确 |
| FG InfoBoard | `infoboard_controller` 的 FG tips/message/holder | 有独立的 ONE_MORE、FREE SPIN WON、剩余次数、FG Win/Total Win 词条；字体、atlas、描边、字号和语言切换以本地竞品参考为准 |
| 最终结算 | `total_win_controller` 或 `{gameId}_res` 的 FG Payout Panel | 位于游戏层之上的独立结算界面，显示整段 FG 累计赢分及本地 `doc/js_scripts` 要求的总授予次数；不得复用单轮 Big Win 金额 |

命名只用于发现资源，不用于猜测实现：

- 本地资源常见正确拼法是 `bonus_*`；旧资源可能使用 `bouns_*`。扫描时两种都查，落地时原样保留 `{gameId}_res` 的 Prefab、节点名、UUID、组件类和属性引用，不擅自纠正拼法。
- 资源存在不等于已接入。必须确认 Prefab 实例已放入 Scene、Controller 属性已绑定、运行时会切 active/opacity，并且入场、Restore、Retrigger、结算和退出都能到达。
- Scene 层级必须从 `{gameId}_res` 的 Scene/Prefab 和 `doc/js_scripts` 的绑定逻辑取证，不能仅凭文件名把所有 Bonus 节点统一挂到 Canvas 根节点。
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

- `addedCount` 使用服务端真实增量。必须先确认目标协议的 remaining 字段是在本轮扣减前还是扣减后取值，再从本地脚本找到对应读取或计算逻辑；通用文件不提供默认公式。
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

#### 3.7.7 目标项目本地证据矩阵

逐行填写真实本地路径、对象和结论。单独看到资源或单独看到方法名都不足以证明完整行为；任何影响实现的空白或矛盾都标记为 `UNKNOWN` / `CONFLICT`，并停止为 `NEEDS_LOCAL_REFERENCE`。

| 待确认事实 | `{gameId}_res` 证据 | `doc/js_scripts` 证据 | 协议/运行时交叉验证 | 结论 |
| --- | --- | --- | --- | --- |
| FG 真正触发条件与初始授予次数 | Scatter/Bonus、提示与入场资源只能证明表现能力 | 条件比较、配置读取和事件入口 | raw response 次数字段、runner 契约、边界 seed | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 正常入场阶段、遮挡点与首轮 Spin 责任 | Loading、Start、背景/前景、操作区的节点层级与动画 | 事件到面板、背后切换、关闭和 Spin action 的 callback 链 | 运行时画面、请求次数和阶段日志 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 每轮扣次、Auto/Turbo 与下一轮推进 | Remaining/计数动画和 FG 专用 UI | 快照、更新时点、round complete 与自动继续条件 | remaining 前后值、请求与表现完成顺序 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Retrigger 条件、`addedCount` 与完成屏障 | Retrigger 面板、Remaining +N、音效和初始状态 | 增量来源、pending guard、多 callback 汇合与清理 | raw 次数变化、面板/计数器日志、下一轮请求 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 最后一轮、单轮大奖与 FG Total Win/退出交接 | Total Win/Payout、背景、InfoBoard、Control 节点层级 | 金额来源、播放顺序、BGM 责任和唯一完成 callback | 最后一轮响应、运行时时间线和下一 Normal Spin | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Restore 的布局、次数、累计值与 UI 恢复 | FG 各节点初始/恢复状态与资源绑定 | restore 入口、赋值顺序、禁止重播项和完成事件 | 恢复响应、无额外 Spin 请求、一次就绪日志 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 语言、异常中断、退出与销毁清理 | font/atlas/i18n、VFX/Audio、active/opacity 初值 | listener/tween/schedule/token 和 BGM 清理 | 切语言、断线、销毁及连续重放 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |

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
| FG-15 | 分别输入 0、1、2、实际门槛和超过门槛个夺宝 | 2 个时按本地竞品参考进入 ONE_MORE/咪牌或 FG；实际门槛与服务端授予次数一致，不提前、不漏触发 |
| FG-16 | 正常入场并检查运行时 Scene | Loading、FG 背景/前景、次数面板、InfoBoard、Start/Payout/Total Win 的父节点、Sibling 顺序、active 和组件引用均与本地竞品参考一致 |
| FG-17 | Loading 遮挡期间切换 FG 转盘背景与前景 | 主画面不露出半套 Normal/FG UI；Loading 拦截输入，退场后 Reel、Symbol、VFX 的前后层级正确 |
| FG-18 | FG 中切换中英文并触发 ONE_MORE、FREE SPIN WON、次数和 Total Win | 使用 `{gameId}_res` 对应词条、font/atlas、描边和字号；无缺字、系统字体替代或 Normal 文案串入 |
| FG-19 | 最后一轮含单轮 Big Win 后进入最终结算 | 先完成单轮大奖，再显示独立 FG Total Win/Payout Panel；金额、总次数、BGM 和退出 callback 不混用 |
| FG-20 | `{gameId}_res` 含 `bonus_*` 或 `bouns_*` 命名 | 两种拼法都能被盘点；目标 Scene 保留本地资源原名、UUID、组件绑定和引用，不因重命名导致失联 |

#### 3.7.9 验收证据

- 保存 Normal 触发、普通 FG Round、Retrigger、最后一轮、0 赢分、Restore 六类可复现 seed/响应。
- 记录 `isFree/isFinished/isSpinFinished`、初始/前后剩余次数、`addedCount`、累计次数和总赢分字段。
- 记录 `FREE_GAME_START/LAST_SPIN_RESTORE/FREE_GAME_END` 或等价事件，以及 BonusLoading 两阶段 callback、首轮 Spin 请求和完成事件顺序。
- 运行时核对 BonusLoading、Remaining、Start/Payout Panel、InfoBoard、ControlPanel、Feature Buy、背景/Footer/倍率节点的 active/opacity/数值。
- 核对 Normal/FG/BigWin/TotalWin BGM 切换、控制台错误和 callback 次数；FG 结束后的下一笔 Normal Spin 必须可操作。
- 保存 `{gameId}_res` 与目标运行时的 Scene 节点路径、Sibling 顺序、Prefab/UUID/组件属性绑定，以及 `bonus_*`/`bouns_*` 搜索结果。
- 保存 FG Loading、转盘背景/前景、InfoBoard 专用词条与字体、最终结算界面的中英文运行时画面。


