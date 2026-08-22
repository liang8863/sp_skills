### 3.9 Resource / Prefab / Scene / Audio / i18n

**通用检查对象**

- 代码 `@property` 类型与 Prefab Component 类型。
- Prefab 节点名称、层级、路径和运行时 `active` 状态。
- Bonus/Free Game 资源同时搜索 `bonus_*` 与 `bouns_*`，并保留资源工程原命名及 Scene 层级。
- SpriteFrame、SpriteAtlas、Spine、AnimationClip、AudioClip 的真实路径。
- `.meta`、UUID、Prefab 实例和脚本 class ID。
- 多语言 atlas、动态加载 fallback、语言切换刷新。
- Animation、Tween、schedule、粒子系统和音效的停止/重置。

**当前项目资源组织**

| 项目 | 资源根 | 典型功能资源 |
| --- | --- | --- |
| YJZR | `assets/resources/yjzr_res/prefab`、`assets/resources/VFX` | `infoboard_controller`、`big_win_controller`、`total_win_controller`、`bonus_loading_controller`、`fs_ui_controller`、`multiplier_*`、`slow_drop_*` |
| JDSRY | `assets/resources/jdsry_res/load_res`、`assets/resources/prefab`、`assets/resources/shared` | `infoboard_controller`、`big_win_controller`、`total_win_controller`、`bonus_loading_controller`、`freespin_remaining_controller`、`multiplier_controller`、`scatter_effect_controller` |

资源目录不同不代表功能不同；功能是否存在要同时看脚本入口、Prefab 绑定和调用方。


