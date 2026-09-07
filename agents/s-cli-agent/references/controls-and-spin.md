### 3.8 GamePanel / Spin / Bet / Auto Spin / Feature Buy

本文件只提供操作区的取证问题和验收维度，不预设目标项目的 View 类名、按钮状态、输入入口或 Feature Buy 流程；实际行为只以 `{gameId}_res`、`doc/js_scripts` 和当前协议/运行时交叉证据为准。

**常见能力**

- Idle、Spinning、Stopped、AutoSpin、FreeGame、FeatureBuy 等按钮/面板状态。
- Spin 点击、Host/Spacebar 触发、点击防重、急停和 Turbo。
- Bet size/level/ways picker、余额不足、最大下注和下注配置加载。
- Auto Spin 次数选择、开始、剩余次数、停止、完成和异常停止。
- Feature Buy 打开、关闭、确认、下注金额变更和购买请求。
- 目标项目实际操作区、信息区与下注区按钮的颜色和状态必须与本地竞品参考对齐；组件类名与节点路径须从本地证据重新定位。normal、pressed、disabled 等状态只以 `assets/resources/{gameId}_res/` 的 Prefab/材质和 `doc/js_scripts/` 的状态逻辑为准。

**验收**

- UI 状态与 GameState/Service 状态一致，不以按钮外观代替真实状态。
- Spin 请求未完成时不能重复提交；Auto Spin 停止不会取消正在结算的结果。
- 下注变化会同步请求参数、界面显示和余额校验。
- Feature Buy 的开关、确认和结果展示不影响普通 Spin 与 Last Spin 恢复。
- 验收目标项目已取证的操作、信息与下注组件时，同时核对按钮各状态颜色与本地竞品参考一致，不得只验证点击逻辑或用代码中的近似颜色替代资源证据。


