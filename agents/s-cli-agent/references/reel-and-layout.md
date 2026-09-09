### 3.4 Reel / SlotReel / 布局

本文件只提供 Reel 取证问题、边界检查和验收维度。下面的术语与流程用于建立假设并寻找证据，不是目标游戏的默认规则；实际列数、行数、阈值、索引、停轮顺序、咪牌、slow-drop、动画和 callback 必须由目标项目的 `{gameId}_res`、`doc/js_scripts` 与协议/运行时证据共同确认。`doc/project_info.md` 只确认 gameId 与竞品网址身份，不是外部取证入口。

**必须分开的能力**

1. 服务端布局格式和客户端布局格式。
2. 列数、每列可见行数、隐藏缓冲和实际 SymbolView 数量。
3. 结果索引、列行坐标、世界坐标和特效位置映射。
4. 首次 Spin 停轮与 Cascade/drop 的不同路径。
5. Wild、Scatter、长符号、倍率编码、消除和补牌。
6. Normal、Turbo、急停、Slow Drop 和错误结果的停止行为。

#### 3.4.1 五模块编排速查表

所有 Reel 实现先由 `gpt-6` 进行取证和方案推理；可选模型标识时使用 `gpt-6-astra`。在写正式 v2 计划前，必须为以下五个模块各写一行编排记录。它们不是五套通用效果，而是五条独立的、由目标本地证据约束的 `source -> target` 表现链；每一行都要把 `{gameId}_res` Prefab 替换决定、新 Prefab 属性/变换决定、VFX/effect、animation/timing、audio、完成 callback 和 cleanup 一起确认，避免只替换图片、只播放动画或只补音效。

| 模块 | 必须确认的状态与数据边界 | `{gameId}_res` Prefab 替换与新属性/变换决定 | VFX / 动画 / 音效 / callback / cleanup 细节 | 最低验收 |
| --- | --- | --- | --- | --- |
| Reel core | raw layout 到可见行、索引/坐标、初始符号、start/stop、mask、Turbo/急停及正常结束边界 | 先查找目标资源的 Reel、Symbol、Mask 或 holder Prefab；记录它替换的旧 view/holder、`@property` 和 target override 影响。新件 position、rotation、scale、anchor、size 和 component defaults 默认保留资源序列化值；只有本地资源、归档 JS 或 runtime 证据证明才调整 | 每种停轮/符号落地效果的资源、动画时长、音效入口、完成 callback 和中断清理；不得让 Turbo 改变结果、触发或 callback 语义 | 布局、正常停轮、Turbo/急停和下一 Spin 无错位、漏回调或残留 |
| Reel background | normal、spin、Spin 咪牌、Drop 咪牌、消除/Cascade、FG/Bonus 等实际存在状态的背景层级、遮罩和前后景归属 | 先查找目标资源的 background、foreground、mask、ambient 或状态控制 Prefab；记录替换后的层级、Scene 引用和旧 controller 退出责任。背景节点的 position、opacity、active 和 layer 顺序从资源 Prefab 起算，不从旧 controller 或旧 Prefab 复制 | 每个状态的背景 effect/Spine/clip、转场时点、loop/one-shot 音效或 BGM 调整、接管 callback 和恢复 normal/FG 背景的 cleanup | 不遮挡 Reel/Overlay；状态切换只发生一次；下一阶段或中断后背景、透明度、层级和音频恢复 |
| Drop peeking | 清除后残留 `R`、待落地 `landed`、slow-drop 门槛、逐列/逐格落地和 FG 达成 guard | 先查找目标资源的 slow-drop、Scatter overlay、mask、light column 或音效 holder Prefab；记录旧 overlay/holder 的替换和跨 Cascade 保留规则。新 overlay 的 transform、active 和 component defaults 保留资源值，除非本地竞品证据证明落点或层级需要调整 | 残留 Scatter 高亮、遮罩/光柱、心跳、riser、落地效果、BGM fade、每颗新 Scatter 的 callback、`AllDropOver` 前的幂等清理 | pending 新牌不提前计数或显现；最晚一列真实完成前不推进；达成与退场各一次 |
| Spin peeking | 已停列 `seen(i)`、`startPeekingIndex`、目标列、ONE_MORE、最终 Scatter/FG 达成与最后一列退出 | 先查找目标资源的 peeking、Scatter、mask、camera/light 或提示 Prefab；记录目标列绑定、旧慢转/提示 owner 和正常停轮复原点。新提示件的位置、scale、anchor、active 和 camera/light defaults 不复制旧值；调整必须由目标本地证据支持 | 目标列慢转、已有 Scatter 高亮、遮罩/镜头、riser/heartbeat、停轮和 Scatter 出现效果、逐列 callback、结束时恢复 BGM/层级 | 不读取完整结果预判；目标只前进一次；最后停轮、急停/Turbo/Auto 与下一阶段无残留 |
| Elimination | 当前帧可消除格、Win/cluster/ways 数据、长符号/固定符号/Overlay 排除规则、清除到补位的完成屏障 | 先查找目标资源的 break/pop、symbol holder、pooled item 或保留 Overlay Prefab；记录旧 clone/holder 的替换、回收 owner 和 target override 影响。新 break/pop、holder 或 overlay 的 transform、opacity、active 和 component defaults 以资源值为准，不能从旧 clone 迁移 | 被清除符号的 VFX、break/pop/消失动画、音效、每格或每批 callback、在 Drop 前销毁/回收 holder 与 Overlay 的顺序 | 只消除本帧真实目标；不误删长符号、固定符号或保留 Overlay；所有清除完成后才开始掉落 |

同一行内的 VFX、动画、音效和 callback 必须来自同一条已证实的状态链，并且具有同一清理责任。资源名、动画名或单张截图不能单独证明整条链；缺少其中任一项时记录 `UNKNOWN` 或对应 Gate，不能用另一款游戏或速查表默认值补齐。

资源 Prefab 替换按以下顺序执行：先在目标 `assets/resources/{gameId}_res/` 中定位普通文件和对应 `.meta`，再对照旧 Prefab 的节点、组件、`@property`、target override、动画/Spine/Audio 引用和现有消费者；旧件只用于判断 owner、消费方和绑定风险。确认后通过 Cocos-aware import/binding 将目标资源接入，并以新 Prefab 的序列化属性为默认值，包含 position、rotation、scale、anchor、size、opacity、active 和 component defaults。不得将旧 Prefab 的任何属性复制到新 Prefab 来维持旧布局；无调整时记录 `KEEP_RESOURCE_SERIALIZED: <本地证据>`，仅在目标 `{gameId}_res`、`doc/js_scripts` 或 runtime 竞品证据证明时，以 `ADJUST_FOR_COMPETITOR: <属性>=<值>; <证据>` 调整。不得复制同级游戏或外部工程的 Prefab，不得用手改 UUID、`fileId`、`__id__` 取代绑定验证。资源根缺失、没有匹配 Prefab 或发现绑定冲突时，保留旧件并记录 `NO_RESOURCE_PREFAB`、`RETAIN_LEGACY` 或对应 Gate。

#### 3.4.2 咪牌判定术语

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

#### 3.4.3 普通 Spin 咪牌流程

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

#### 3.4.4 Cascade / 掉落咪牌流程

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

#### 3.4.5 转盘背景与消除编排

**转盘背景**必须与 Reel core 和两种咪牌状态分开取证。先识别背景的 owner、Node/Prefab 层级、normal/spin/咪牌/Cascade/FG 状态和是否有前景遮罩，再分别追踪每一个已证实状态的 VFX、动画、音效及恢复 callback。背景动画完成不能代替 Reel、咪牌或消除的完成；只可由本地脚本或运行时证明的 owner 交接控制权。新 Spin、Turbo、急停、进入/退出 FG、销毁和异常路径都要恢复背景 active、opacity、sibling order、BGM/loop 音效和未完成 tween。

**消除**在 Drop 之前建立当前帧的目标快照。将每个待清除位置从协议/表现数据映射为 `(reelIndex, positionIndex, resultValue)` 或目标项目等价键，并先排除长符号、固定/Sticky 符号、保留的 Scatter/Bonus Overlay 和非 Symbol 特效。按目标证据指定逐格或逐批顺序播放 break/pop VFX、动画和音效；完成 callback 必须形成清除屏障，之后才能改变 holder、启动重力补位或进入 Drop。异常中断、新 Spin、Turbo、销毁时取消 tween/listener 并释放管理的 clone/overlay，不能清除下一个结果或上一轮仍需保留的对象。

#### 3.4.6 目标项目本地证据矩阵

逐行填写目标项目的真实路径与结论。资源和旧脚本只能互相补强，不能互相替代；任何会影响实现的空白或矛盾都标记为 `UNKNOWN`，并停止为 `NEEDS_LOCAL_REFERENCE`。

| 待确认事实 | `{gameId}_res` 证据 | `doc/js_scripts` 证据 | 协议/运行时交叉验证 | 结论 |
| --- | --- | --- | --- | --- |
| Reel 列数、各列可见行、隐藏缓冲与 SymbolView 数 | Scene/Prefab 节点路径、尺寸、mask、序列化数组 | 布局初始化与 view 建立调用链 | raw layout 长度、拆列日志、边界格画面 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| raw/compact index 到列行与世界坐标的转换 | Reel/Symbol 父节点、anchor、spacing、特效挂点 | layout helper、索引转换与 symbol id 解析 | 首尾 index、变高列、特殊符号定位 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Reel background 的状态层级、遮罩与恢复 owner | 背景/前景节点、Prefab、Spine/Animation、AudioClip、初始 active/opacity | 状态切换、VFX/动画/音效播放、callback、BGM/tween 清理入口 | normal/spin/咪牌/Cascade/FG 的状态时间线和中断恢复画面 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 普通 Spin 的停轮、咪牌与达成条件 | 遮罩、光柱、Scatter holder、动画与音频对象 | 单列停轮、累计计数、状态切换、完成与清理 callback | 可复现 seed 下的逐列日志和画面 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Cascade/drop 的残留统计、补位、slow-drop 与完成条件 | drop 路径资源、overlay、目标格与落地动画 | 清除快照、pending/landed 计数、完成屏障与 guard | 每列待补/已落地数、阶段事件时间线 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Elimination 的目标、效果、完成屏障与回收 | break/pop 特效、符号/Overlay holder、长符号和固定符号资源 | 当前帧目标快照、排除规则、逐格/批次 callback、drop 前 barrier、清理/回收路径 | 真实消除位置、VFX/动画/音效顺序、AllClear 到 Drop 时序 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Scatter/Bonus 真正门槛及 ONE_MORE 语义 | 提示资源和状态对象只能证明表现能力 | 比较条件、配置读取点和状态机 | raw 响应的奖励次数、runner 契约和边界 seed | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Normal/Turbo/急停/Auto 的差异 | 各模式可用动画与初始状态 | 分支条件、时长来源、共用判定和清理入口 | 相同响应在各模式的结果与 callback 次数 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 新 Spin、切模式、销毁与异常中断清理 | 节点初始 active/opacity、音频和 VFX 归属 | tween/schedule/listener/token 的释放路径 | 连续重放后无视觉、音频或状态残留 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
#### 3.4.7 最低验收用例

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
| BG-01 | normal -> Spin -> Spin 咪牌 -> normal，或目标项目已证实的同类链路 | 背景 VFX/动画/音效与 callback 按本地状态链切换；不遮挡 Reel，退出后背景和 loop 音效恢复 |
| BG-02 | Drop 咪牌、Cascade 或 FG 接管期间急停/新 Spin/销毁 | 背景 tween、遮罩、层级、BGM/loop 和 callback 幂等恢复，无串轮残留 |
| ELIM-01 | 同时存在普通中奖格、长符号/固定符号和需保留 Overlay | 只消除当前帧目标；VFX/动画/音效按证据顺序执行，排除对象完整保留 |
| ELIM-02 | 多批消除且最后一批延迟完成 | 最后一个清除 callback 前不进入 Drop；完成后 holder/clone/overlay 清理正确 |
| BOUNDARY-01 | Scatter 位于每列最上/最下可见格、隐藏缓冲、首个 compact index | 只统计可见格；坐标、遮罩和特效都落在正确 Reel/row |
| CLEANUP-01 | 咪牌中急停、切 Turbo、开始新 Spin、退出 FG 或销毁节点 | 循环音效、BGM fade、mask、overlay、camera、tween/schedule 和完成 callback 全部恢复且可重复调用 |

#### 3.4.8 验收证据

Reel/咪牌需求不能只凭静态代码验收。至少保留一组可复现 seed/响应，并同时记录：

- 原始布局、拆列后的可见布局、`T`、`startPeekingIndex`。
- 每列停轮的 `reelIndex`、本列 Scatter 数和 `seen(i)`。
- 每次 `PeekingStart/PeekingStop` 或等价状态、目标列、InfoBoard mode。
- 每次 Cascade 的 `R`、清除格、各列待补牌数、pending/landed 数、新 Scatter 落地时点。
- Reel background 的状态、VFX/动画/音效、owner callback 和 normal/FG 恢复前后截图或日志。
- Elimination 的目标快照、排除项、VFX/动画/音效、清除完成屏障和进入 Drop 的时序。
- `AllSpinOver/AllDropOver`、下一次 Cascade、FG 入场或最终结算的先后顺序。
- Normal、Turbo、急停各一段运行时画面/日志；控制台无错误，下一 Spin 无 VFX、音频、遮罩或状态残留。

- 长符号/倍率编码仍需额外验证不会被普通 symbol id 或 Scatter 解析逻辑破坏。


