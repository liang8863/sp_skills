### 3.2 GameService / API / 交易

**职责**

`GameService` 是交易生命周期与游戏专属 hooks 的边界，不负责直接操作节点。两个项目都使用 `BaseGameServiceLogic` 处理通用流程，再由项目 hooks 定义：

- 游戏 ID。
- Last Spin 是否未完成。
- 恢复后是否进入 Free Game 模式。
- 首次 Spin 结果和后续 Cascade 结果使用哪个事件。
- Spin 完成时如何触发 Free Game。
- 恢复完成后如何重新进入完整表演链。
- 是否自动更新余额、是否提供 Feature Buy、是否提供画面赢分更新。

**常见公开入口**

```text
setGetBetInfoCallback()
setGetTurboModeCallback()
checkLastSpin()
restoreLastSpin()
spin(betInfo)
autoSpin(count, betInfo)
featureBuy(betInfo)
stopAutoSpin()
```

**需求拆解**

任何 API 或金额问题都要写清：

```text
用户动作
  -> BetPanel 产生 bet snapshot
  -> GameService / BaseGameServiceLogic
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


