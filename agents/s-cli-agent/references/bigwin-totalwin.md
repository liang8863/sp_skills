### 3.6 BigWin / TotalWin

#### 3.6.1 定义与边界

本文件只提供 BigWin/TotalWin 的取证问题、风险边界和验收维度。等级名称、数量、阈值、金额基准、状态、Skip、自动退场、资源组合、音频与交接顺序都不是预设答案，必须由目标项目的 `{gameId}_res`、`doc/js_scripts` 与协议/运行时证据逐项确认。`doc/project_info.md` 只确认 gameId 与竞品网址身份，不是外部取证入口。

| 名称 | 定义 | 常见错误 |
| --- | --- | --- |
| `baseBet` | 本次 Spin 的有效总下注；优先使用响应/PlayerData 的 bet amount，必要时才由 `winAmount / winMulti` 回推 | 使用 bet size 代替总下注，导致所有阈值偏移 |
| `ratio` | `finalWinAmount / baseBet`，用于判断 Small/Medium/Big/Mega/Super Mega | 使用固定金额判断，换下注后等级错误 |
| `finalWinAmount` | 当前完整 Spin 在所有 Cascade、倍率收集和终局结果后的最终赢分 | 把单次 Cascade/单帧赢分传给 Popup |
| `targetLevel` | Big Win Popup 最终应到达的等级；等级数量、顺序和 key 必须来自本地 `{gameId}_res` 与 `doc/js_scripts`，不能默认固定为三级 | 数字跨阈值但标题/VFX 没升级，或把其他项目的等级枚举直接搬入 |
| `displayLevel` | 当前已经完整套用标题、Sprite、动画、VFX 和音效的等级；它不是仅由滚动金额临时算出的值 | 金额已进入下一档，但画面仍混用前后两级资源 |
| `presentationGeneration` | 每次打开、切级、Skip、Dismiss 时递增的表现代号，用于拒绝过期异步加载和动画回调 | Popup 已关闭，旧加载结果仍回写 Sprite 或重新启动特效 |
| `audioSessionId` | 本次 Popup 音频会话标识；所有滚分 loop、等级 sting/voice、到额音和恢复 BGM 操作都要归属当前会话 | 上一轮延迟回调在新一轮播放，或 Dismiss 后旧音效继续响 |
| `targetPayout` | Popup 数字滚动必须到达的最终金额 | Skip 后只停动画，没有设置最终值 |
| Big Win Popup | 覆盖游戏主画面的全屏大赢表演：遮罩、标题、数字滚动、等级 VFX、金币、BGM/SFX、Skip 和退场 | 与 InfoBoard 的 BIG 底板/金额显示混为同一组件 |
| InfoBoard Total Win | Popup 退场后的底板与金额交接，也用于未达到 Popup 阈值的普通最终赢分 | Popup 尚未退场就提前播放，或结束后完全漏播 |
| FG Total Win Panel | Free Game 全部结束后的整段累计赢分结算弹窗 | 把单轮 Big Win 当成整段 FG Total Win |

Big Win 判定必须发生在最终赢分已经稳定之后。典型顺序是：

```text
最后一轮 Reel/Cascade 完成
  -> 倍率/特殊奖励收集完成
  -> 取得 finalWinAmount、baseBet、ratio
  -> 未达到 Big Win：InfoBoard Total Win/普通 Win
  -> 达到 Big Win：打开全屏 Popup
  -> Popup 数字滚动和等级升级
  -> 到额 WAITING 或用户 Skip
  -> Popup Dismiss + 清理
  -> InfoBoard Total Win（项目要求时）
  -> callback 一次
  -> Retrigger / FG 结束 / 下一 Spin
```

#### 3.6.2 Big Win Popup 状态机与多级表现

| 状态 | 进入动作 | 允许操作 | 离开条件 |
| --- | --- | --- | --- |
| `INITIAL` | 保存 payout、targetLevel、阈值和当前是否 FG；重置旧 tween/schedule/VFX | 不接受 Skip | BGM 淡出和入场延迟完成 |
| `PLAYING` | 激活全屏 root/遮罩，播放本地竞品参考定义的起始级别，数字从 0 滚到目标，跨阈值时原子切换整套等级表现 | Skip 延迟结束后可点击 | 自然滚到目标，或第一次 Skip 直接补齐最终金额/目标等级 |
| `WAITING` | 显示最终金额与高潮效果，主滚分音切到结束音，准备恢复 Normal/FG BGM | 第二次 Skip 延迟结束后可退场 | 等待时间结束，或第二次 Skip |
| `DISMISSING` | 禁用 Skip，播放淡出/退场，停止音频和 VFX，恢复场景 BGM | 不再响应点击 | 退场动画完成后 reset，并执行 callback 一次 |

Popup 必须满足：

- 第一次 Skip 只负责完成数字滚动和等级升级；第二次 Skip 才允许退场。若项目设计是单次 Skip，也必须明确写入需求，不能由实现者猜测。
- Skip、自然完成、自动退场、异常 fallback 可能同时到达，必须用 `state/completed` guard 保证回调只执行一次。
- 达到最终值时必须显示精确金额，不能因浮点、分段 tween 或阈值相等而少一分/少一级。
- Popup 的 root、遮罩、标题、数字、金币、粒子、循环音效、BGM fade、按钮事件和 schedule 都要在 reset/onDestroy 清理。
- 在 FG 内触发 Big Win 时，退场恢复 FG BGM；Normal Spin 则恢复普通 BGM。
- Turbo 可缩短等待，但不能跳过最终值、Dismiss、InfoBoard/Total Win 交接或 callback。
- Popup Controller 缺失、资源加载失败或动画异常时，要走不阻塞结算的 fallback，并仍显示最终金额。

多级大奖必须按本地竞品参考拆成可验收的等级表现：

| 检查项 | 通用规则 |
| --- | --- |
| 弹窗数量 | 只查当前项目的 `{gameId}_res` 与 `doc/js_scripts`。不得套用其他游戏的 Popup 数量；只有本地证据明确分成多个 Prefab 时才实现多个 |
| 触发时点 | 只在完整 Spin 的 Reel/Cascade、倍率和特殊奖励全部稳定后判级；FG 单轮 Big Win 与 FG 最终累计结算分开 |
| 等级升级 | 从本地竞品参考定义的起始等级播放，滚分跨阈值时同步切标题、动画、VFX、金币和音效；Skip 必须直接补齐最终金额及 `targetLevel` |
| 等级资源 | 每一级都核对标题 atlas/字体、数字字体、动画 clip、VFX、BGM/SFX 和本地化资源；不能用普通 Label 或近似样式代替 |
| Scene 层级 | 保持 `{gameId}_res` 的父节点路径、Sibling 顺序和遮罩层级；Popup 位于 Reel/GamePanel/InfoBoard 之上，`total_win_controller` 仍为独立结算节点 |
| 互斥与复位 | 任一时刻只允许一个大奖 Popup root 生效；切级不重复派发 callback，退场后所有等级 holder、音效、VFX 和输入监听恢复初始状态 |

#### 3.6.3 本地竞品参考与等级资源契约

Big Win 的目标表现只以当前目标项目内的 `assets/resources/{gameId}_res/`、`doc/js_scripts/` 与 `doc/project_info.md` 为竞品参考，不以外部资源工程、其他游戏或通用命名为准。分析与实现前按以下优先级重建自然滚分、跨级、Skip 和退场契约：

1. `{gameId}_res` 的节点 `active` 初值、SpriteFrame、AnimationClip、粒子、音频、材质、序列化引用与 UUID/meta。
2. `doc/js_scripts` 控制器的切级顺序、动态加载路径、动画事件、fallback 和清理逻辑。
3. `doc/project_info.md` 的 `gameId`、竞品地址和已记录项目约束；地址只用于识别来源，不替代本地行为证据。

为当前项目建立一份等级资源契约；没有证据的字段标记 `UNKNOWN`，不得从其他游戏或名称相似的资源猜测：

| 字段 | 必须记录的内容 |
| --- | --- |
| 等级 | 本地竞品参考中的 `levelKey`、显示名称、顺序和最终等级 |
| 阈值 | 配置/响应字段、倍率或金额基准、等号归属，以及换算后的 `levelStartPayout` |
| Holder | Popup root 下的完整节点路径、默认 `active`、Sibling 顺序、是否与其他等级共用节点 |
| 标题与数字 | Sprite/Label/BitmapFont 组件路径、序列化 SpriteFrame UUID，或动态 atlas/bundle/path/frame key；本地化映射也要逐级记录 |
| 动画 | 入场、切级、循环、高潮、退场 clip 名称；Animation/Spine track、时长、WrapMode、事件帧和完成回调来源 |
| VFX | 爆发/常驻粒子、金币雨、遮罩、背景光、材质和 shader；标明每级独有或全等级共用 |
| 音频 | 滚分 loop、每级 sting/voice、到额音、退场音和 Normal/FG BGM；逐项记录 AudioClip/服务 key、bundle/path、代码或动画事件触发者、bus/channel、loop、音量、fade/overlap、播放 handle、停止时点和加载拥有者 |
| 加载与清理 | 序列化引用或动态加载方式、加载拥有者、缓存范围、失败路径，以及 stop/release/reset 时点 |

如果任一本地固定参考路径缺失、目标等级资源不完整，或 Prefab 绑定与旧脚本行为矛盾且无法解释，状态为 `NEEDS_LOCAL_REFERENCE`。不得查询外部资源工程，也不得用普通 Label、相近 Sprite、其他游戏 VFX 或猜测路径补齐后宣称还原完成。

#### 3.6.4 Sprite、动画、音效与动态资源就绪门禁

先从本地 `{gameId}_res` 与 `doc/js_scripts` 识别引用方式，再保持同一种运行时契约：

| 资源来源 | 接入规则 | 禁止行为 |
| --- | --- | --- |
| Prefab 序列化 `@property` | 保留组件类型、SpriteFrame/AnimationClip/AudioClip 引用、UUID 和节点绑定；实例化后直接使用 | 为了“统一”擅自改成字符串路径动态加载 |
| `SpriteAtlas` | 加载 `{gameId}_res` 的实际 atlas，并用已验证的精确 frame key 取 SpriteFrame；同时核对 plist/texture/meta | 猜文件名、扩展名、子资源后缀或大小写 |
| `resources`/Bundle | 使用 `doc/js_scripts` 证明的 bundle、相对路径和资产类型；记录 bundle 就绪时点 | 把 `assets/resources` 文件系统路径直接当运行时地址，或混用其他游戏的路径常量 |
| 动态 `AudioClip`/音频服务 | 保持本地旧脚本使用的 AudioClip 类型或音频服务 key；验证 bundle/path、缓存、bus/channel、loop 和返回 handle | 猜音效 key、绕过既有音频服务、按文件名推断路径，或用全局 `stopAll` 清理单个 Popup |
| Prefab/Spine/材质复合资源 | 通过 Cocos export/import 保留依赖图，核对 skeleton/atlas/texture/material/shader 和动画名 | 只复制图片或 JSON，留下缺失 UUID、材质或 atlas 引用 |
| 本地化标题 | 按 `{gameId}_res` 与旧脚本的语言 key、atlas 或 bundle 切换；加载请求绑定当前语言与表现代号 | 旧语言异步结果返回后覆盖当前语言标题 |

资源门禁必须满足：

- 按 `doc/js_scripts` 策略在打开 Popup 前预载全部等级，或至少预载当前级和下一可能等级。本地证据未明确时优先完整预载，并把该差异标记为未覆盖，避免滚分已经跨级才开始找资源。
- 同一路径并发请求必须复用一个 Promise/缓存结果；不得因金额 tween 每帧检查而重复 `load`。
- 每次 `show`、切级、Skip、Dismiss 和销毁都校验 `presentationGeneration`、节点有效性和当前状态。过期加载只可释放本次拥有的动态引用，不能写 Sprite、激活动画或派发 callback。
- 下一等级所需的标题、字体、动画、VFX 和音频必须整体 ready 后才能切级。先在隐藏状态完成引用赋值和动画复位，再在同一受控步骤切换 holder，禁止出现“Mega 标题 + Big 背景/VFX”或一帧空图。
- 只释放控制器明确拥有的动态引用；Prefab 序列化资源、共享 atlas/bundle 和其他控制器共用缓存不得在单次 Popup 退场时误释放。
- 动态 AudioClip 与 Sprite/动画资源使用同一套 Promise 去重和 generation 检查。加载完成时若 `audioSessionId`、`presentationGeneration` 或状态已失效，只能按拥有关系释放，不能补播旧级音效。
- 分析阶段发现本地资源缺失必须阻断验收。已发布运行时仍要保证结算 callback 不被卡死；其降级方式优先复刻 `doc/js_scripts`。本地参考没有可证明的降级时，只能保底显示最终金额并记录视觉/音频未还原，不能以保底表现通过验收。

#### 3.6.5 大奖、巨奖、超级大奖切换时序

自然滚分时，以统一的 `displayLevel` 驱动整套表现，不允许标题、VFX、音频各自通过金额独立判级：

```text
显示金额跨过 nextLevel.levelStartPayout
  -> 判定本次确实从 displayLevel 进入 nextLevel
  -> 等待/确认 nextLevel 整套资源 ready
  -> 锁定切级并递增 presentationGeneration
  -> 停止当前级独有的 transient/loop，保留本地竞品参考定义的共用滚分与金币效果
  -> 在隐藏状态给 next holder 绑定 Sprite/字体/clip/VFX/AudioClip
  -> 同一受控步骤关闭旧 holder、开启新 holder
  -> 从头播放切级/标题入场/爆发 VFX，并只触发一次该级音效
  -> 更新 displayLevel，解除切级锁
```

切级规则：

- 使用服务端/配置的 canonical 金额或最小货币单位比较边界，不能读取格式化 Label 文本判级。`ratio == threshold` 的归属必须与等级契约一致。
- Tween 单帧跨过多个阈值时，是否逐级播放或直接到目标级，必须按 `doc/js_scripts` 与本地 AnimationClip 证据决定。需要逐级时使用队列，前一级切换完成后才进入下一级；不得同帧启动多套动画和音效。
- 每一级只允许成功进入一次。重复金额更新、慢加载回调和 Animation Event 都必须经过 `displayLevel + presentationGeneration + state` guard。
- 切级不是一次结算完成事件。任何等级的动画完成都不得提前调用 Popup callback、Total Win、余额套用或 round end。
- 共用滚分 BGM/金币雨是否跨级持续、每级 sting 是否叠加、旧级 loop 是否淡出，都以本地旧脚本、音频和 AnimationClip 为准。先检查 Animation Event，避免代码和 clip 同时播放同一音效或生成同一 VFX。

第一次 Skip 发生在 `PLAYING` 时：

```text
锁定输入并使旧 tween/load/animation callback 失效
  -> 金额精确设为 targetPayout
  -> 取得 targetLevel 整套已就绪资源
  -> 按本地竞品参考直接套用最终级，或完成必须保留的中间切级
  -> 最终级高潮表现只触发一次
  -> 进入 WAITING，不直接重复 Dismiss/callback
```

如果 Skip 时最终级资源仍未 ready，不得先显示混搭资源。等待、取消或降级路径必须跟随本地旧脚本；无可证明路径时使用最终金额保底并记录视觉失败，但结算流程仍必须可结束。

不同表现组件的切换与清理重点：

| 组件 | 切级动作 | Reset/Dismiss |
| --- | --- | --- |
| Sprite/BitmapFont | 新资源完整赋值后再显示；保持 `{gameId}_res` 的 SizeMode、颜色、材质和本地化选择 | 清除仅本次持有的动态引用，恢复初始 holder 与语言状态 |
| Animation | 停止旧级 clip，复位新级播放位置，先注册一次性完成监听再播放；事件帧不得重复派发 | 使用相同 callback/target 解绑，停止并复位所有等级 clip |
| Spine | 按本地资源的真实 track/animation/mix 播放，切级前清理旧 track 或监听 | 清除 complete listener/track，并恢复 `{gameId}_res` 默认皮肤与动画 |
| Particle/VFX | 每级爆发只 `reset/play` 一次；共用 loop 按本地旧脚本决定是否持续 | 停止发射、清理残粒子并恢复节点 active |
| Tween/schedule | 金额 tween 与切级 tween 分开拥有；切级只停止当前级对象 | 停止所有 Popup 拥有的 tween，按原 callback 引用 unschedule |
| Audio | 每级 sting/voice 只进一次，循环音保存 handle；确认是否由 Animation Event 驱动 | 停止 Popup loop/voice，避免停止全局共用 BGM，并恢复 Normal/FG 音乐 |

##### 音效与 BGM 会话规则

每次 `show` 创建新的 `audioSessionId`，并记录进入 Popup 前的模式与本地竞品参考定义的音频状态。所有异步加载、Animation Event、延迟播放、fade 完成和音频完成回调都要同时验证 `audioSessionId + presentationGeneration + state`；只检查节点是否存在不足以阻止旧会话串音。

| 音频角色 | 启动与切级 | Skip/WAITING | Dismiss/异常 |
| --- | --- | --- | --- |
| 场景 BGM | 按本地旧脚本选择 pause、stop 或 fade；保存 Normal/FG 模式及恢复责任，不能只看当前节点名猜测 | 通常不在首次 Skip 时提前恢复 | 只由当前会话恢复一次正确的 Normal/FG BGM；新模式已接管时不得用旧回调覆盖 |
| 滚分 loop | Popup 入场后启动一次并保存 handle；跨级是否持续、升调或换 clip 以本地竞品参考为准 | 到额时停止/淡出或切到 final 音，只执行一次 | 按 handle 停止当前会话拥有的 loop，禁止全局停止其他 UI/场景音效 |
| 等级 sting/voice | 成功进入每一级时最多一次；播放顺序、是否允许前后级重叠、是否先停旧 voice 以本地竞品参考为准 | 直达最终级时取消未进入等级的排队音；是否补播中间级只按本地证据 | 取消未触发的延迟任务，停止本地旧脚本要求中断的 voice/sting |
| 到额/final 音 | 自然滚到 `targetPayout` 时由唯一入口触发 | Skip 到额与自然完成竞争时仍只播放一次 | 不作为 callback 是否完成的隐式替代，除非本地旧脚本明确由音频完成事件推进状态 |
| 退场音 | 只在进入 `DISMISSING` 时播放一次 | 第二次 Skip 和自动退场竞争时由状态 guard 去重 | 即使 clip 缺失也必须完成视觉退场和结算 callback |

音频实现必须满足：

- 每个音效在等级资源契约中指定唯一触发者：`doc/js_scripts` 控制器或本地 Animation Event 二选一。若两处都存在，必须通过目标运行日志确认其中一处是 guard/fallback，而不是照搬成双播。
- 保存 Popup 自己启动的 loop、voice、sting 和 fade handle，并按 handle/所属 bus 停止。不得使用会影响 Reel、按钮、InfoBoard 或场景 BGM 的宽泛全局停止。
- 动态 AudioClip 在相应等级整体 ready 前不得参与切级；加载失败不能让金额 tween、WAITING、Dismiss 或 callback 永久等待。视觉和音频降级都必须记录，且不能冒充与本地竞品参考一致。
- 快速跨级时，音效按本地竞品参考选择逐级队列或直达最终级；队列中的每项携带目标 level 和 generation。`displayLevel` 已越过、发生 Skip 或会话结束后，旧项必须丢弃。
- 首次 Skip 先使旧金额 tween、等级队列、延迟音效和动画事件失效，再应用最终级。最终级 sting/voice/final 音各自是否播放，必须与本地竞品参考的同一 Skip 时点一致，不能为了“有声音”全部补播。
- 静音、音量、前后台 pause/resume 继续由项目音频服务管理。Popup 不得在恢复 BGM 时擅自解除静音、重置全局音量，或在 resume 后重复创建滚分 loop。
- Dismiss、节点销毁或切场景后返回的 AudioClip 加载、fade 和 completed callback 都不得播放声音、恢复旧 BGM、重开 Popup 或触发结算 callback。

#### 3.6.6 目标项目本地证据矩阵

逐行填写真实本地路径、对象和结论。资源只能证明可用表现，脚本只能证明已归档逻辑；两者还需协议与运行时交叉验证。任何影响实现的空白或矛盾都标记为 `UNKNOWN` / `CONFLICT`，并停止为 `NEEDS_LOCAL_REFERENCE`。

| 待确认事实 | `{gameId}_res` 证据 | `doc/js_scripts` 证据 | 协议/运行时交叉验证 | 结论 |
| --- | --- | --- | --- | --- |
| 等级名称、数量、顺序及最低触发等级 | holder、标题、动画、VFX、音频资源集合 | 枚举/配置读取、判级分支和等级切换入口 | 边界 seed、运行时标题与等级日志 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| `baseBet`、最终赢分、ratio 和边界归属 | 资源不能证明金额语义 | 响应字段读取、快照与计算位置 | raw response、mapper 输出和屏幕金额 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Popup 数量、Scene 层级和输入遮挡 | Prefab/Scene 父路径、Sibling、mask 和按钮绑定 | 实例化、显示、active/opacity 与输入处理 | 运行时节点树和点击行为 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 自然滚分、跨级与各级原子资源切换 | 每级 Sprite/font/clip/Spine/粒子/AudioClip | tween、加载、切级队列、generation 与完成 callback | 金额/holder/VFX/SFX 时间线 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| Skip 可用时点、点击阶段与目标行为 | 按钮、提示与对应动画状态 | state guard、补金额、直达/逐级、退场分支 | 各阶段点击的金额、状态与 callback 次数 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 自动退场、InfoBoard/FG 交接与 BGM 恢复 | 退场 clip、Total Win 节点和音频资源 | timer/animation event、交接调用链和模式快照 | 自动/手动竞争、Normal/FG 各一条时间线 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |
| 动态加载失败、销毁与下一轮 reset | 初始状态、资源拥有关系与 fallback 能力 | cache、release、过期 callback 拒绝和幂等清理 | 缺资源、延迟返回、连续两轮运行证据 | `VERIFIED` / `CONFLICT` / `UNKNOWN` |

分析计划必须写出每一项阈值来源、金额基准、边界归属、时序来源和未覆盖项；通用参考不得提供默认数值或默认时长。

#### 3.6.7 最低验收用例

| ID | 输入/操作 | 通过标准 |
| --- | --- | --- |
| BW-01 | `ratio` 刚低于 Big 阈值 | 不打开 Popup，仍完成普通/Medium/InfoBoard Total Win 路径 |
| BW-02 | `ratio` 分别等于 Big、Mega、Super Mega 边界 | 等号归属正确，Popup 最终等级和标题正确 |
| BW-03 | 相同赢分、不同 bet amount | 按 `ratio` 得到不同等级，证明没有用固定金额判级 |
| BW-04 | 有多次 Cascade/倍率收集 | Popup 使用最终完整赢分，不使用中间 frame 金额 |
| BW-05 | 自然播放至结束 | 数字逐段到精确目标，跨级 VFX 顺序正确，WAITING 后自动退场 |
| BW-06 | PLAYING 中点击 Skip | 数字立即到最终值，标题跳到 targetLevel，只进入一次 WAITING，不直接消失 |
| BW-07 | WAITING 开放后再次点击 Skip | 只执行一次 Dismiss/callback，所有音频、遮罩和按钮事件清理 |
| BW-08 | 在 FG 内和 Normal 各触发一次 | 退场分别恢复 FG/Normal BGM，背景和控制面板状态不串模式 |
| BW-09 | Popup Controller/动画资源不可用 | 记录错误并 fallback 到最终金额显示，结算不被卡住 |
| BW-10 | Popup 退场后进入 InfoBoard Total Win | 两层显示不重叠、不重复升级；最终金额一致，完成前不进入下一 Spin |
| BW-11 | 连点 Skip、自动退场与动画 callback 同帧发生 | callback、余额套用、Retrigger/round end 都只执行一次 |
| BW-12 | Popup 中销毁节点、切场景或异常中断 | 无残留 BGM/SFX、VFX、遮罩、tween、schedule 和输入监听 |
| BW-13 | 分别触发每个本地已定义等级 | 标题、字体、数字、动画、VFX、音效按本地竞品参考逐级对应；同一时刻只有一个等级 holder/Popup 生效 |
| BW-14 | 打开 Popup 并检查运行时 Scene | 父节点路径、Sibling 顺序、遮罩覆盖、输入拦截和 `total_win_controller` 的独立层级均与 `{gameId}_res` 一致 |
| BW-15 | 自然滚分依次跨过所有本地等级 | 按 `doc/js_scripts` 顺序切级；每级 holder、标题、VFX 和 sting 原子切换且只进入一次，无混搭或空白帧 |
| BW-16 | 单帧金额更新跨过两个以上阈值 | 逐级队列或直达逻辑与本地竞品参考一致，不同级动画/音效不并发抢状态 |
| BW-17 | PLAYING 中最终级资源尚在加载时 Skip | 不显示旧级 Sprite + 最终级 VFX；过期加载不回写，最终金额与 callback 仍可正确收口 |
| BW-18 | Popup Dismiss/销毁后动态加载才返回 | generation/state guard 拒绝回写，不重新激活 holder/VFX，不重复 callback，引用按拥有关系释放 |
| BW-19 | 同一 Sprite/atlas 被连续金额帧请求 | 实际只发起一次加载并复用缓存；frame key、资源类型、路径与 `{gameId}_res`/旧脚本一致 |
| BW-20 | BigWin 播放中切换语言 | 标题按本地竞品参考刷新；旧语言请求返回后不得覆盖当前语言，不影响金额和等级状态 |
| BW-21 | 前一轮达到最高级，关闭后下一轮只达到 Big | 所有 holder、clip、Spine track、粒子、Sprite、音频和 `displayLevel` 已复位，不残留最高级表现 |
| BW-22 | 人为缺失目标级 Sprite/atlas/clip/AudioClip | 分析验收标记 `NEEDS_LOCAL_REFERENCE`；运行时不阻塞结算但明确记录视觉/音频失败，不用近似资源冒充通过 |
| BW-23 | 对照本地竞品参考与目标运行时 | 节点 active、SpriteFrame/atlas key、clip、粒子、音频、切级顺序和动态加载日志逐项一致；差异有证据和结论 |
| BW-24 | 自然依次进入所有本地等级 | 每级 sting/voice 按 `doc/js_scripts` 顺序各播放一次；滚分 loop 的持续/换音、旧 voice 的停止/重叠均一致 |
| BW-25 | 同一等级的 Animation Event 与代码路径同时可达 | 只有等级资源契约指定的触发者实际播放，日志和音频 handle 证明没有双播 |
| BW-26 | 起始等级第一次 Skip 直达最终等级 | 未进入等级的排队音被取消；最终级 sting/voice/final 音的播放组合和时点与本地竞品参考一致，各自最多一次 |
| BW-27 | Dismiss/销毁后动态 AudioClip 或 fade callback 才返回 | 不补播、不恢复旧 BGM、不生成新 handle、不重复 callback；只释放当前请求拥有的引用 |
| BW-28 | Normal 与 FG 各触发一次，并让自动退场和第二次 Skip 竞争 | 只恢复一次正确模式 BGM，不串到另一模式，不停止 Reel/InfoBoard/按钮等非 Popup 音效 |
| BW-29 | 静音或自定义音量下播放，期间切到后台再恢复 | 不擅自解除静音或重置音量；resume 后滚分 loop、等级音和 BGM 都不重复实例化 |
| BW-30 | 动态 AudioClip 连续请求、加载失败后再次打开 Popup | 同一路径请求去重；失败不阻塞结算；新会话不复用失效 handle，缓存与 release 次数符合本地旧脚本的拥有关系 |

#### 3.6.8 验收证据

- 记录 `finalWinAmount`、`baseBet`、`ratio`、各等级阈值、`targetLevel` 和金额来源。
- 记录 Popup `INITIAL/PLAYING/WAITING/DISMISSING` 转换、Skip 点击阶段和 callback 次数。
- 保存 Big/Mega/Super Mega 边界 seed/响应及运行时画面，核对本地化标题、数字、遮罩和 VFX。
- 记录 Popup、InfoBoard Total Win、Retrigger/FG Exit/round end 的先后顺序。
- 验证 Normal/FG BGM 恢复，以及下一 Spin 不残留 Popup 节点、音频、按钮或金额。
- 保存 `{gameId}_res` 与目标运行时的 Popup Scene 路径、Sibling 顺序、组件绑定、各等级 holder/clip/font/atlas 对照。
- 保存等级资源契约，包含每级阈值、holder、Sprite/atlas/bundle/path/frame key、动画、VFX、音频、加载拥有者和失败路径。
- 保存本地旧脚本推导的期望时间线与目标运行时切级时间线：金额、`displayLevel`、`targetLevel`、`presentationGeneration`、加载开始/完成、holder active、clip/VFX/SFX 和 callback。
- 对动态加载记录请求次数、缓存命中、过期请求拒绝、Dismiss 后回写次数（必须为 0）及资源释放对象。
- 保存音频会话时间线：`audioSessionId`、进入前模式、每个 AudioClip/服务 key 的触发者、load/play/stop/fade 时点、bus/channel、handle、Skip/切级时状态，以及最终恢复的 BGM。
- 对每一级证明 sting/voice/final/退场音的实际播放次数；Animation Event 与代码路径的重复播放次数必须为 0，Dismiss 后新音频 handle 数必须为 0。


