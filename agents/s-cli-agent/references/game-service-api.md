### 3.2 GameService / API / 交易

本文件只提供交易/API 的取证问题和验收维度，不提供任何既有專案的基底類、hooks、公開方法或事件順序作為目標行為答案。`doc/project_info.md` 只確認 gameId 與網址身份；競品行為只可由目標 `{gameId}_res` 與 `doc/js_scripts` 證明。

**待确认职责**

先从目标项目定位交易生命周期与游戏专属适配的真实拥有者，再确认它是否直接操作节点，以及如何定义：

- 游戏 ID。
- Last Spin 是否未完成。
- 恢复后是否进入 Free Game 模式。
- 首次 Spin 结果和后续 Cascade 结果使用哪个事件。
- Spin 完成时如何触发 Free Game。
- 恢复完成后如何重新进入完整表演链。
- 是否自动更新余额、是否提供 Feature Buy、是否提供画面赢分更新。

**目标项目本地证据矩阵**

| 待确认事实 | `{gameId}_res` 证据 | `doc/js_scripts` 证据 | raw 协议/当前运行时验证 | 结论 |
| --- | --- | --- | --- | --- |
| 交易拥有者与对外入口 | UI 绑定只能证明触发对象 | 实际类、方法、参数、调用者与 callback | 输入动作到请求日志 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| bet 快照、请求参数与金额单位 | 面板显示和序列化配置 | 快照取得、换算、请求建立与锁定时点 | raw request 与屏幕下注 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| raw response、mapper 与结果事件 | 资源不能证明数据语义 | 字段读取、转换、事件发布和消费者调用链 | raw/mapped payload 对照 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 首次结果、后续 frame 与 round complete | 对应表现资源只能证明能力 | frame 路由、完成条件、幂等 guard | 多 frame 时间线和完成次数 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Auto/Turbo/Stop/Feature Buy 分支 | 控件、状态资源和初始 active | 分支入口、互斥、错误与恢复路径 | 各操作的请求、状态和余额 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Last Spin 查询、恢复与 FG 状态 | Restore/FG 资源和初始状态 | 未完成判定、恢复赋值与完成 callback | 可重放响应、无重复下注 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |

任何影响实现的空白或矛盾都标记为 `UNKNOWN` / `CONFLICT`；不得从通用方法名或其他项目补齐。

**需求拆解**

任何 API 或金额问题都要写清：

```text
用户动作
  -> BetPanel 产生 bet snapshot
  -> 目标项目内已取证的交易拥有者
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


