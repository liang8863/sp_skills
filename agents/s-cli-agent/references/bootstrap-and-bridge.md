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


