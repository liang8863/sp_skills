### 3.9 Resource / Prefab / Scene / Audio / i18n

本文件只提供资源取证与验收维度，不以通用命名、其他项目结构或文件存在本身定义目标行为。`doc/project_info.md` 只确认身份；行为必须由目标 `{gameId}_res` 和 `doc/js_scripts` 的具体对象与调用链共同证明。

**通用检查对象**

- 代码 `@property` 类型与 Prefab Component 类型。
- Prefab 节点名称、层级、路径和运行时 `active` 状态。
- Bonus/Free Game 资源只在 `assets/resources/{gameId}_res/` 内同时搜索 `bonus_*` 与 `bouns_*`，并保留本地竞品资源的原命名及 Scene 层级。
- SpriteFrame、SpriteAtlas、Spine、AnimationClip、AudioClip 的真实路径。
- `.meta`、UUID、Prefab 实例和脚本 class ID。
- 多语言 atlas、动态加载 fallback、语言切换刷新。
- Animation、Tween、schedule、粒子系统和音效的停止/重置。

**当前项目资源组织**

- 从 `doc/project_info.md` 读取 `gameId`，资源根固定为 `assets/resources/{gameId}_res/`。
- 竞品旧逻辑只从 `doc/js_scripts/` 查找；不得回退到外部资源工程、`CC3Proj`、`*_UI` 或其他游戏。
- 功能是否存在要同时看本地旧脚本入口、`{gameId}_res` 的 Prefab/动画/音频/序列化绑定，以及目标实现调用方。
- `assets/resources` 下其他历史或共用目录不是当前竞品行为证据。


