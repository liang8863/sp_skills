# Output Templates

Write documents in Chinese under `<target-game>/doc/`. Prefer date-stamped names. Keep evidence paths relative to the game project when possible, and include absolute paths in the final user summary.

## Competitor Requirement Document

```markdown
# <GameId> 竞品需求分析（<Competitor Name>）

## 基本信息

- 竞品地址：
- 测试日期：
- 目标项目：
- 测试环境：
- UI 逆向工程输入：
- 证据目录：
- 采样结论：完成 / 采样未完成 / 阻塞

## 采样计数

| 指标 | 目标 | 实际 | 是否达标 | 证据 |
| --- | ---: | ---: | --- | --- |
| 总 spin | 500 |  |  |  |
| 状态栏观察 spin | 300 |  |  |  |
| 倍率动画事件 | 20 |  |  |  |

## 转盘布局

- 轴数：
- 每轴可见行数：
- 中奖路/线：
- 符号尺寸与遮罩：
- 特殊符号出现位置：
- 停轮顺序：
- 截图证据：

## 状态栏 / 文字跑马灯

引用状态矩阵文件：

总结：

## 消除与倍率动画

引用倍率动画矩阵文件：

总结：

## 玩法规则

- 赔付：
- Wild / Scatter / Bonus：
- 免费旋转：
- 自动旋转：
- 最高赢奖：
- 异常/网络状态：

## 与本地项目/资源对照

- 本地项目状态：
- 可复用资源：
- 缺失资源：
- 旧逻辑/参考代码：

## 已确认行为

## 推测行为

## 未覆盖状态

## 验收标准

## 待 PM / 用户确认
```

## Spin Sampling Log

```markdown
# <GameId> Spin 采样日志

## 采样配置

- 起始时间：
- 结束时间：
- 竞品 URL：
- 视口：
- 模式：手动 / 自动 / turbo
- 初始余额：
- 投注额：

## 计数器

| 指标 | 目标 | 实际 |
| --- | ---: | ---: |
| total_spins | 500 |  |
| status_bar_spins | 300 |  |
| multiplier_events | 20 |  |

## 采样表

| sample_id | spin_index | timestamp | mode | status_bar_text | status_bar_state | reel_state | multiplier_event_id | capture_path | notes |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |

## 阻塞与恢复方案
```

## Status-Bar State Matrix

```markdown
# <GameId> 状态栏状态矩阵

| state_id | visible_text | trigger | duration | priority | interruptible_by | animation | capture_path | confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
```

## Multiplier Animation Matrix

```markdown
# <GameId> 倍率动画矩阵

| event_id | spin_index | mode | source_position | multiplier_value | trigger | path | impact_target | timing | skip_behavior | result_update | capture_path | confidence |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
```
