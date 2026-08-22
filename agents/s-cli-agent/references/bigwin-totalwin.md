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


