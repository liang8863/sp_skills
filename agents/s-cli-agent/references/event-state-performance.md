### 3.3 Event / State / Performance

本文件只提供事件链的取证问题和验收维度。下列事件名是搜索候选，不代表目标项目一定存在或遵循相同时序；真实发布者、消费者、payload、状态与 callback 必须从 `{gameId}_res`、`doc/js_scripts` 和当前协议/运行时重新确认。

**通用事件类别**

| 类别 | 事件示例 | 消费者 |
| --- | --- | --- |
| Spin | `SPIN_START`、`SPIN_RESULT`、`SPIN_COMPLETE` | Reel、Performance、SpinButton、InfoBoard |
| 停轮 | `STOP_REEL_SPIN` | Reel/Performance/SpinButton |
| Cascade | `CASCADE_START`、`CASCADE_RESULT` | Reel、消除、倍率、InfoBoard、Performance |
| Free Game | `FREE_GAME_START`、`FREE_GAME_END` | FreeGame、Performance、InfoBoard、BGM |
| Restore | `LAST_SPIN_RESTORE` | Reel、FreeGame、Performance、UI |
| Auto Spin | `AUTO_SPIN_START/PROGRESS/COMPLETE` | SpinButton、ControlPanel、Performance |
| 其他 | `MULTIPLIER_CHANGE`、`RESPIN_*` | 由当前项目专属模块消费 |

**Performance 的职责**

- 注册事件并保存本次结果快照。
- 控制“开始转 -> 收到结果 -> 停轮 -> 落地 -> 中奖/消除 -> 下一帧/结算”。
- 统一处理 `AllSpinOver`、`AllDropOver`、`SPIN_COMPLETE` 的先后竞争。
- 在 Free Game 最后一轮、BigWin、TotalWin 或 Retrigger 的动画结束后才发完成事件。
- 防止同一终局被多个入口重复路由。

**验收**

- 事件发布者、payload、消费者、后续状态能逐个对上。
- 同一结果不会因为 `SPIN_COMPLETE` 和 Reel 完成事件先后不同而重复结算。
- 任何动画 callback 未触发时，有日志或超时路径可定位卡点。


