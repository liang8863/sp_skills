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


