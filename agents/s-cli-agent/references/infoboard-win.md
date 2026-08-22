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


