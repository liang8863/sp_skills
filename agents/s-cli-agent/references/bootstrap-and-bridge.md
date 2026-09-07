### 3.1 Bootstrap / Loading / Bridge

本文件只提供啟動流程的取證問題和驗收維度，不提供任何既有專案的初始化順序、類別或方法作為目標行為答案。`doc/project_info.md` 只確認 gameId 與網址身份；競品行為只可由目標 `{gameId}_res` 與 `doc/js_scripts` 證明。

**待确认职责**

- 初始化 HostBridge，接收语言、Token、Host 输入和生命周期消息。
- 加载 ExternalModules，并在其初始化前注册游戏自定义配置。
- 建立 GamePanel、BetPanel、GameService 和 action executor 的连接。
- 加载 bets/config，关闭 Loading，检查 Last Spin，决定进入 Idle 或恢复表演。
- 通知 Host 游戏已就绪。

**目标项目本地证据矩阵**

| 待确认事实 | `{gameId}_res` 证据 | `doc/js_scripts` 证据 | 当前协议/运行时验证 | 结论 |
| --- | --- | --- | --- | --- |
| 启动阶段、真实顺序与拥有者 | Loading/主界面 Prefab、初始 active 和序列化绑定 | bootstrap 入口、异步调用链与完成 callback | 启动日志与节点状态时间线 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 语言、Token、Host 与服务初始化依赖 | 本地化资源和 Loading 状态 | 参数消费点、等待条件、失败与重试分支 | 缺失/延迟输入下的日志与恢复结果 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 自定义配置注册时点 | 资源通常不能单独证明此项 | 配置注册与服务读取的调用先后 | 初始化日志和实际生效配置 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 主界面连接、Loading 关闭与 GameReady | 面板层级、初始状态和关闭动画 | 实例取得、连接、通知与幂等 guard | 首次启动的画面、事件和可操作状态 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Last Spin 检查与恢复分支 | Restore 所需资源与初始状态 | 查询、判定、恢复、完成和异常路径 | 可重放响应、无重复下注与最终状态 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |

任何影响实现的空白或矛盾都标记为 `UNKNOWN` / `CONFLICT`；不得从通用顺序或其他项目补齐。

**需求拆解**

- 启动问题：先查初始化顺序、异步等待、ExternalModules 是否存在、GamePanel 是否找到。
- Loading 问题：查加载完成事件、错误/重试、关闭条件和 Last Spin 分支。
- Host 问题：查 HostBridge 消息来源、事件监听、语言/Token 是否在消费前就绪。

**验收**

- 正常首次启动：Loading 关闭、语言正确、GameReady 发出、Spin 可点击。
- 已有未完成 Spin：Last Spin 被检查并恢复，不重复下注。
- ExternalModules/网络失败：有明确错误路径，不能让界面停在不可操作的半初始化状态。


