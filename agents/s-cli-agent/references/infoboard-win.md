### 3.5 InfoBoard / 跑马灯 / Win / Total Win

本文件只提供取证问题和验收维度，不定义目标游戏的模式名称、职责拆分、金额来源、资源组合或播放顺序。所有行为事实都必须回到目标项目的 `{gameId}_res`、`doc/js_scripts` 与协议/运行时证据确认；`doc/project_info.md` 只确认 gameId 与竞品网址身份，不是外部取证入口。

InfoBoard 应视为一个需要取证的小型显示状态机，而不是预设成“一个数字 Label”。待确认能力包括：

| 能力 | 输入 | 验收重点 |
| --- | --- | --- |
| 普通跑马灯 | 启动、普通 Idle、Spin 结束 | normal 文案循环，进入 Win 时正确停止/淡出，回 Idle 后可恢复 |
| FG 跑马灯 | `FREE_GAME_START`、FG 中间轮 | 使用 FG 文案，不误用 normal 文案，语言切换后资源刷新 |
| Scatter 提示 | Scatter peeking/slow drop | 触发条件、列/位置、重复触发、被 Win 打断后的清理 |
| Free Spin Won | Scatter 触发完成 | 播放一次，完成 callback 能推进 FG 入场 |
| 单次 Win | frame/cascade win amount + WinType | 金额快照、Win/金额文案、Small/Medium/Big 底板、数字滚动、倍率特效 |
| Total Win | FG 结束或完整 Spin 结算 | total amount、滚动/静态、收集/跳过、退场、BGM/UI 恢复 |
| 模式切换 | 任意显示请求 | 互斥、skip、turbo、打断 callback、旧 tween/schedule/VFX 清理 |

**目标项目本地证据矩阵**

| 待确认事实 | `{gameId}_res` 证据 | `doc/js_scripts` 证据 | 协议/运行时交叉验证 | 结论 |
| --- | --- | --- | --- | --- |
| 本地实际显示模式及互斥关系 | holder、Label、Sprite、动画、粒子和初始状态 | mode 定义、切换入口、优先级和打断逻辑 | 逐模式触发画面与 current state 日志 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 跑马灯、Win 数字与 Total Win 的职责拆分 | 各节点父路径、组件绑定和资源归属 | 事件消费者、金额入口、callback 调用链 | 同一结果的显示顺序与 callback 次数 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| frame、Cascade、Spin 与 FG 金额快照 | 资源只能证明显示能力，不证明金额语义 | 读取字段与快照保存位置 | raw response、mapper 结果与屏幕金额 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 文案、字体、atlas、底板与语言刷新 | 本地资源键、font/atlas、SizeMode 和绑定 | i18n key、语言事件和刷新路径 | 各语言运行时画面 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 数字滚动、VFX、音频与完成时点 | clip、Spine、粒子、AudioClip 和 Animation Event | tween/schedule、播放入口、完成 callback | 运行时时间线与唯一完成事件 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Skip、重复事件、新 Spin 与销毁清理 | 初始 active/opacity 和资源拥有关系 | guard、token、listener、tween 与 schedule 清理 | 重放后无残留且下一阶段只推进一次 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |

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


