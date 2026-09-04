# JS 到 Cocos Creator 2.4 TypeScript 逆向指南

本文用于后续类似 slot 游戏工程的 JS 到 Cocos 2.4 TS 还原：把 `assets/scripts/*.js` 中的 Cocos Creator 2.x 编译后 JavaScript 脚本，还原成 Cocos Creator 2.4 风格的 TypeScript 源码。

本指南只覆盖这一件事：JS 到 Cocos 2.4 TS 还原。不要处理 Prefab/Scene 绑定切换，不要改原 JS 的 UUID 或 `.meta`，不要改美术资源。

## 目标和边界

本轮还原的目标是恢复一份语义一致、结构可读、主要类型明确、后续可维护的 TS 代码。类型应由原 JS 行为、Cocos 序列化信息、调用点和业务语义逐步确认，不能为了补类型牺牲原 JS 语义。

核心目标：

- 原 JS 行为不变。
- 你要充分了解 cocos 2.4 本身的 api，才可以在转换过程中明确对应关系
- 游戏主逻辑脚本一一对应维护 TS 文件。
- 字段、方法参数、返回值尽量推断出明确类型；当遇到当前转换上下文中还不确定的外部引用类型，可以先用临时接口，但收口前必须替换为真实脚本引用类型或明确的边界接口。
- Cocos 2.4 的 `cc.*` API、`cc._decorator`、action、schedule、事件用法保持不变。
- 类、方法、字段尽量恢复语义命名。
- 原始 JS 保留为对照源。


明确不做：

- 不替换 Cocos 2 的 `node.x/y/width/height/opacity/color`、`runAction`、`cc.sequence` 等 API。
- 不切换 Prefab/Scene/Resources 中的脚本绑定。
- 不修改原 `assets/scripts/*.js`、对应 `.js.meta`、UUID。
- 不修改图片、音频、spine、prefab、scene、resource 等美术和资源文件。
- 不为了过扫描把无法判断的类型写成 `any`。
- 不做大规模业务重构。

推荐目录：

```text
assets/scripts        原始编译后 JS，保留不动
assets/scripts_ts24   Cocos 2.4 风格 TS 还原中间产物，不参与当前工程脚本绑定
```

`assets/scripts_ts24` 是逆向工作区，不是最终接入目录。不要把 2.4 TS 中间产物直接放进 `assets/scripts`，也不要在同一目录里让 `Foo.js` 和 `Foo.ts` 作为正式脚本并存。若后续需要让 TS 继承原脚本绑定，必须放到单独的最终替换接入阶段处理：`Foo.ts.meta` 继承 `Foo.js.meta` 的 `uuid`，并移除或备份旧 JS 脚本，避免同 uuid 或同组件名的双脚本资产污染编辑器索引。

进度记录使用人工维护文件，例如：

```text
assets/scripts_ts24/TS_REVERSE_PROGRESS.md
```

记录内容应包括当前处理模块、对照过的原 JS、已完成的语义命名、已补类型、剩余风险和最新验证命令结果。不要把进度依赖在自动生成报告上。

### 本地 Git 记录

开始 JS 到 Cocos 2.4 TS 还原前，应确认对应工程目录已经有本地 Git 仓库；如果没有，应先在该工程目录执行 `git init`，并按项目需要补充 `.gitignore`，用于保留可追溯的本地提交记录。这个本地 Git 不要求配置远端，也不替代用户后续正式仓库。

开始正式翻译前，应先做一次基础提交，记录原始工程、`.gitignore`、配置和未修改的源脚本状态，保证后续翻译 diff 干净可追溯。基础提交前同样必须查看 `git status`，确认不会提交 `library/`、`temp/`、`build/`、`node_modules/` 等生成目录。

翻译过程中允许 Codex 自主进行阶段性提交，提交粒度应围绕可理解的工作单元，例如建立基线和依赖顺序、完成一组底层 model/helper、完成一组 controller、完成阶段质量抽查等。提交前必须查看 `git status`，只提交本次翻译相关文件，避免把用户未说明的无关改动混入提交。

建议提交信息使用清晰的阶段描述，例如 `js2ts24: add dependency order baseline`、`js2ts24: restore slot result models`、`js2ts24: record quality sampling results`。每次提交后，在 `TS_REVERSE_PROGRESS.md` 记录提交范围和最近验证结果。

## 步骤 1：建立基线和依赖顺序

先确认源脚本规模，并建立后续所有检查的基线。

```bash
find assets/scripts -maxdepth 1 -type f -name '*.js' | wc -l
```

本工程经验：

- 源脚本：280 个 `.js`。
- 本轮还原目标：优先还原游戏主逻辑脚本；通用工具/框架脚本按默认不逆向清单跳过。
- 目标目录额外允许维护一个辅助文件，例如 `assets/scripts_ts24/_dependency_order.txt`。

后续类似 slot 项目中，先建立默认不逆向清单。清单的唯一权威来源是根目录的：

```text
JS_TO_COCOS24_TS_IGNORE_MODULES.txt
```

清单里的模块直接忽略，不进入 JS 到 Cocos 2.4 TS 还原范围。这些模块主要是通用工具、列表/导航/设置 UI 框架、setting UI 套件、粒子工具或稳定数字显示工具，既有逆向经验已经确认游戏主逻辑不需要为它们投入重复逆向成本。

不要把所有依赖都机械加入忽略清单。`Utils`、`GameEventHandler`、`UIAppearanceHelper`、`Preference`、`BVFramework` 这类共享脚本可能被主流程或业务脚本直接使用，应按实际业务依赖判断，不随工具链一起忽略。

如果个别游戏相关脚本确实引用了这些文件，优先保留兼容引用，而不是完整逆向它们。例如在 TS 中使用保守 CommonJS 兼容写法：

```ts
const IgnoredTool = require("./IgnoredTool");
```
如果输出目录没有这些工具类的 TS 文件，就先引用原 JS 文件或保留原 JS 模块名引用，保证 controller 能跑通。后续由人工把这些引用替换成已有稳定逆向产物。

忽略清单里的组件不要在业务 TS 中重复声明方法形状接口。常见做法是直接引用原 JS 模块，并用 `InstanceType<typeof Module.default>` 表达组件实例：

```ts
const NumberDisplayControllerModule = require("NumberDisplayController");
type NumberDisplayController = InstanceType<typeof NumberDisplayControllerModule.default>;
```

如果业务侧确实给忽略 JS 对象临时补了额外字段，只保留最小交叉类型，并用业务语义命名，例如 `NumberRollControllerWithDuration`；不要写成 `NumberDisplayControllerRuntime`、`TimedWinRollControllerLike`、`AnimParticleSystemCompat` 这类临时命名。

真正需要重点逆向的是主游戏流程、slot 数据、状态机、业务 controller、handler、资源加载和业务 helper。业务 controller 使用数字显示工具时，只处理业务 controller 自身逻辑，不把数字显示工具链纳入逆向范围。

文件数量检查、依赖图过滤和缺失检查都读取这个文件，避免在多个位置重复维护清单。

### 建立依赖顺序

不要按文件名或文件大小直接转换。先扫描每个 JS 文件里的 `require(...)`，建立依赖图，并维护依赖顺序文件。

推荐产物：

```text
assets/scripts_ts24/_dependency_order.txt
```

依赖顺序原则：

1. 常量、枚举、纯工具。
2. 数据模型、配置、repository。
3. framework、helper。
4. UI controller。
5. slot controller、state machine。
6. 主入口。

遇到依赖环时先记录，不要在本轮还原中强行拆环。本工程曾出现类似：

```text
AudioManager -> GameAudioAdapter -> AudioManager
```

### 优先从同类项目检索等价源

同一厂商、同一套 slot framework 或相邻版本的游戏，往往复用了大量基础模块。当前项目的 JS 如果经过压缩、混淆或变量重命名，优先在用户允许访问的同类项目中只读检索同名脚本或已经还原过的 TS，通常能显著减少重复翻译、语义命名和类型恢复时间。

这是一条高收益的翻译加速路径，但不能跳过当前项目原 JS 的核验。开始搜索当前项目目录之外的路径前，必须先向用户说明准备检索的范围和目的；不得静默扩大检索范围。其他项目只允许读取，不能修改，也不能让当前项目在构建时依赖它们。

适合优先启动跨项目检索的信号包括：

- 多个项目位于同一游戏产品目录，并具有相近的 Cocos Creator 版本或构建结构。
- 存在大量稳定的共享模块名，例如 `APIClient`、`AudioAdapter`、`DataSource`、`RequestHandler`、`SlotController`、`Utils`。
- `require` 依赖关系、导出形式、类继承和 Cocos 装饰器形状显示它们来自同一套 framework。
- 当前 JS 的私有字段和局部变量已被混淆，但字符串、常量、资源名、事件名和控制流程仍可用于比对。

候选文件不能只凭文件名相同就认定为等价。采用前至少逐项核对：

1. 模块依赖及其使用方式。
2. default、named、`module.exports` 等导出语义。
3. 类继承关系、prototype 方法、getter/setter。
4. `@ccclass`、`@property` 对应的字段数量、类型和顺序。
5. 关键字符串、数字常量、枚举值和资源路径。
6. 分支、循环、状态迁移、事件、schedule、action 和 callback 的执行顺序。
7. 游戏专用差异，例如 reel/row 数量、bonus/respin 规则、音频和资源配置。

如果项目已有自动化对照工具，应优先使用内容哈希、规范化 AST、脚本 UUID 和结构指纹缩小人工核验范围。UUID 或文件名都不能单独证明等价；自动门禁通过后仍须确认当前项目的常量、资源路径、字段和关键执行顺序没有被参考项目覆盖。

只有结构和行为能够对应时，候选源码才能作为等价源加速还原。完全等价的共享模块可以复用已还原 TS，再以当前 JS 做完整审计；只有部分结构相同时，只借用可信的语义命名、类型和类结构，并按当前 JS 重写差异部分。当前项目的原 JS 始终是运行行为真源，其他项目不能用来建立当前游戏的规则、协议、RTP、配置或玩法结论。

跨项目检索和复用必须维护逐文件来源证据。建议使用项目级 `TS_REUSE_EVIDENCE.json`，或复用项目已有的等价源证据文件；不要为同一流程建立多套互不一致的记录。每条记录至少包含：

- 当前模块及原 JS 路径、哈希。
- 参考项目、参考 JS/TS 路径及哈希。
- UUID 是否一致，以及采用的 AST、结构或人工核验方法。
- 核验状态和差异摘要。
- 复用范围：完整复用、仅借用命名/类型，或拒绝复用。

跨项目复用的正确流程是：发现候选、只读比较、记录证据、确认等价范围、复制或重写到当前 `assets/scripts_ts24`、再以当前 JS 做完整审计。最终的文件数量、parse、类型、prototype、decorator、export 和后续 Cocos 验证仍然必须在当前项目完成。复用翻译代码时保留当前项目自己的脚本资源身份；不得直接继承参考项目的 `.meta` 或 UUID。

## 步骤 2：手工结构还原

编译后 JS 通常有 Cocos 模块包装：

```js
if (!cc._RF.push(module, "...", "SomeScript")) {
  var Other = require("OtherScript");
  ...
  cc._RF.pop();
}
```

还原成 Cocos 2.4 TS 时，应转换为普通 TS 文件：

```ts
// Restored from assets/scripts/SomeScript.js.

import Other from "./Other";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SomeScript extends cc.Component {
  @property(cc.Node)
  buttonNode: cc.Node = undefined;

  init(config: object): void {
    // ...
  }
}
```

机械还原要点：

- 默认不逆向清单以外的游戏主逻辑 `.js` 创建或维护同名 `.ts`。
- 去掉 `cc._RF.push/pop` 包装。
- 恢复 `cc._decorator`、`@ccclass`、`@property(...)`。
- `cc.Component` 子类恢复成 TS class。
- `Object.defineProperty(... getter/setter ...)` 恢复为 TS getter/setter。
- 常量、枚举、配置对象恢复为 `export const` / `export enum`。
- 原 `exports.xxx = xxx` 恢复为命名导出。
- 原 `exports.default = X` 或 `module.exports = X` 需要结合调用方判断 default export、named export 或 `export =`。
- 回调类型的 closure 要转换成箭头函数。

在不确定导出形态时，优先保持能匹配现有调用方的保守写法。不要为了统一风格破坏循环依赖或运行时引用。

导入风格也要在收口时清理：能用 default import 或 named import 的地方不要保留 `import * as Xxx`。namespace import 容易保留编译后 JS 的机械形状，也会掩盖真实 API 边界。只有确实需要整个模块对象作为运行时值时才保留，并记录原因。

回调转换要区分语义：

- `cc.callFunc(() => ...)`、数组遍历、loader callback、`Utils.sequenceCallback` / `delayCallback` 中不依赖动态 `this`、`arguments`、`super`、`new.target` 的匿名函数，优先改成箭头函数。
- 如果原 JS 通过 `var self = this`、`var controller = this` 只为闭包保留当前实例，改成箭头函数并删除临时变量。
- 装饰器 descriptor wrapper、`apply/call` 代理、或确实依赖调用时 `this` 的函数表达式不要强行箭头化；这类残留要在进度文档里说明。

Cocos 2.4 已有的内置常量应直接使用，不要把编译后业务包装继续当作业务常量。例如动画完成事件优先用 `cc.Animation.EventType.FINISHED`，不要额外保留 `GameConstant.CC_ANIMATION_EVENT.FINISHED` 这类可替代包装。

### 执行策略

转换重点始终是“不丢逻辑”。按依赖顺序逐个文件处理，每个文件都先对照原 JS 的模块包装、prototype、导出形态和装饰器，再改 TS 本体。不要把某个具体类的业务语义藏在外部生成流程里；语义恢复必须落到 `assets/scripts_ts24/*.ts` 文件中。

推荐顺序：

1. 结构还原：去壳、恢复 class、decorator、import/export、prototype、enum。
2. 基础类型：补 `@property`、初始化值、`new`、简单 `getComponent`、简单 return 能确定的类型。
3. 调用点推断：根据同文件和跨文件调用点、赋值流、getter/setter、callback 调用方式推断参数和返回值。
4. 校验收口：扫描缺失字段类型、缺失参数类型、缺失返回类型、`any` / `Function` 残留。

结构还原错了就回到原 JS 对照；类型推断错了就回到调用点和赋值流，不要用宽泛类型掩盖问题。

推荐策略：

- 保留原 action、tween、schedule、事件、回调顺序。
- 保留运行时注入和外部桥接对象的动态形态。
- `// @ts-nocheck` 只作为临时保护；收口前必须移除或记录明确原因。
- 所有类成员函数最终都要补访问器；访问器必须基于全局调用图和继承图判断，不能只看单文件。

尤其不要在以下代码中调整执行顺序：

- slot 状态机。
- spin/result/prize/bonus 流程。
- scroll view、grid view、list view。
- audio、resource loading、retry。
- `schedule` / `unschedule`。
- `node.on` / `node.off`。
- `cc.callFunc`、`Utils.delayCallback`、`Utils.sequenceCallback`。

还原完成后，先保证所有 TS 文件能 parse，再保证字段、参数和返回值的类型检查扫描通过。

## 步骤 3：语义命名、类型推断和 prototype 对照

编译后 JS 常有大量短名，例如 `At`、`Et`、`tn`、`en`、`Pa`、`Qa`。命名恢复必须按文件上下文来，不要全局盲替换。

命名优先级：

1. public method 和生命周期方法。
2. class private/helper method。
3. `this.xxx` 字段。
4. 跨文件调用的 callback 和 config。
5. 局部变量。

建议先处理核心可读性：

- state/context/controller/dataSource 这类主干对象。
- slot、result、spin、bonus、respin 的状态方法。
- UI controller 中由回调串起来的方法。
- getter/setter 背后的状态字段。

### 类型推断

编译后的 JS 已经丢失了大部分 TS 类型信息。类型恢复必须发生在结构还原之后，并且很多方法参数要等跨文件调用点明确后才能收窄。

按以下优先级推断：

1. Cocos 装饰器：
   - `@property(cc.Node)` -> `: cc.Node`
   - `@property(cc.Label)` -> `: cc.Label`
   - `@property([cc.Node])` -> `: cc.Node[]`
   - `@property({ type: SomeClass })` -> `: SomeClass`
2. 字段初始化值：
   - `= false` / `= true` -> `: boolean`
   - `= 0` -> `: number`
   - `= ""` -> `: string`
   - `= []` -> 首轮可临时用 `object[]` 或窄 union；能从 push/赋值收窄时必须改成具体数组类型。
   - `= Object.create(null)` / `{}` -> 首轮可临时用角色命名接口、`Record<string, object>` 或窄 primitive/object union；能从 key/value 用法收窄时必须改。
3. 构造和组件获取：
   - `new SomeClass(...)` -> `SomeClass`
   - `node.getComponent(SomeClass)` -> `SomeClass | null`
   - `node.getComponent("SomeClass")` 如果本地存在同名脚本，可转成 `SomeClass | null`；否则按真实调用字段建立最小边界接口，或对忽略 JS 模块使用 CommonJS require + `InstanceType<typeof Module.default>`。
4. 函数参数：
   - 从所有调用点收集实参类型。
   - 从方法体属性访问推断结构，例如 `slotConfig.row`、`slotConfig.column` 可生成局部 `SlotConfig` 接口。
   - 从默认值推断可选参数，例如 `void 0 === x && (x = 0)` -> `x?: number`。
   - callback 参数按调用方式推断，例如 `done && done()` -> `done?: () => void`。
5. 返回值：
   - 遍历所有 `return` 分支。
   - 无返回值 -> `: void`。
   - 返回 `true/false` -> `: boolean`。
   - 返回数字/字符串 -> `: number` / `: string`。
   - 部分分支无返回 -> 加上 `| undefined`。
   - getter 也要补返回类型。

最小可接受策略：

- 装饰器字段必须补类型。
- 有明确初始化值的 class 字段必须补类型。
- 所有方法参数必须有类型；
- 所有方法返回值必须有类型；
- 不允许为了通过扫描把所有内容统一写成 `any` 或 `unknown`。
- 首轮还原如果必须临时使用 `unknown`，要在同轮或下一轮根据调用点收窄；收口时不允许残留 `unknown` 作为可恢复类型。能从调用点、字段访问、资源类型、组件类型、协议字段恢复的，必须恢复。真正动态边界用 `object`、窄 primitive/object union，或角色命名的边界接口表示。

### 临时接口和边界类型收拢

前期为了推进可以写局部接口，但全量 TS 完成后必须进行一次类型收拢：

1. 如果已有对应 TS 类，优先直接 import 真实类，不保留 `XxxRuntime` / `XxxInstanceRuntime` / `XxxLike`。
2. 如果目标是忽略 JS 模块，直接用 CommonJS require + `InstanceType<typeof Module.default>`，不要复制忽略 JS 的完整接口。
3. 如果目标是 asset bundle / shell / setting menu / automation / 外部协议等确实没有 TS 类的运行时边界，可以保留局部接口，但命名应表达角色，例如 `SettingMenuService`、`GameAudioBundleAsset`、`ShellLaunchContext`、`GameContextBridge`、`SceneNodeBundleView`。
4. 收口时全局扫描并清空临时命名：`RuntimeValue`、`Like`、`Compat`、`Facade`、`Placeholder`、以及可替换的 `*Runtime`。
5. `*Runtime` 后缀只会让后续维护者误以为仍是临时桥；最终代码里应避免使用。确实要表达“运行时对象”时，也要换成业务角色名。

### Prototype 对照

只靠 parse 通过不够。逆向最容易漏的是 prototype 方法。

原 JS 可能包含：

```js
Class.prototype.foo = function () {};
Class.prototype["ab"] = function () {};
Object.defineProperty(Class.prototype, "value", {...});
```

转换后必须确认：

- TS class 中没有漏掉原 prototype 方法。
- getter/setter 都被恢复。
- 字符串形式的方法名没有被误删。
- 重名 prototype 赋值按原 JS 最终生效版本处理。

重点检查：

- state machine。
- slot controller/helper。
- 数据模型和交易结果模型。
- resource loading、audio、main flow。
- UI controller 中由 callback 调用的方法。

默认不逆向清单里的通用工具文件不进入 prototype 对照主流程。只有当业务脚本真实调用到其中某个方法时，才围绕该调用点做最小兼容处理。

### 成员访问器

所有文件完成还原后，要对类接口做全局扫描，并给类成员函数补 `public` / `protected` / `private`。

访问器判断顺序：

1. 外部调用：被其他文件、组件生命周期、runtime 入口、事件系统、schedule、callback、字符串方法名或导出 API 调用的函数，标记为 `public`。
2. 基类契约：基类定义、子类 override、模板方法、生命周期钩子、抽象接口占位方法，优先标记为 `protected`；只有状态机、外部框架或组件生命周期会直接调用的契约才标记为 `public`。
3. 内部实现：只被本类 `this.xxx()` 调用，且没有字符串访问、回调注册、继承 override 证据的函数，标记为 `private`。
4. 不确定边界：如果存在动态调用、字符串调用、外部框架调用或 Cocos 生命周期可能性，先保留 `public` 并记录原因。

实践中最容易漏的不是“没加访问器”，而是访问器过宽。收口时必须额外检查：

- 子类 override 的访问级别要与基类契约一致。基类是 `protected` 时，子类不能继续保留 `public`。
- `customInit`、`customReset`、`initNodes`、`setupRuntimeComponents`、`playXxxEffect`、`onXxxAnimation` 这类由基类模板流程调用、给子类覆写的钩子通常是 `protected`。
- `AppState.onPrepare/onEnter`、`UIState.onStateRun/cleanUpState`、Scroller 的 `onReset/onRun/onEnd` 这类框架模板钩子通常是 `protected`，外部通过包装入口调用。
- 只在本类内部回调链中使用的方法，即使被 `bind(this)`、`scheduleOnce`、`cc.callFunc` 使用，也可以是 `private`。例如数字滚动 update callback、内部 overflow/scroll callback、内部 dispatch callback。
- Cocos 生命周期（`onLoad`、`onEnable`、`onDisable`、`update`、`onDestroy` 等）、节点事件直接绑定入口、跨文件 controller API、资源/prefab 可能通过字符串调用的入口，继续保留 `public`。

检查方式：

- 扫描所有 class method、getter、setter，建立 `ClassName.methodName` 索引。
- 扫描所有跨文件 import、实例方法调用、静态方法调用和导出引用，建立外部调用图。
- 扫描 `extends` 关系，建立继承图；基类方法被子类实现或调用时不能标成 `private`。
- 扫描 `node.on`、`schedule`、`cc.callFunc`、`bind`、字符串形式 `this["xxx"]` / `getComponent(...).xxx`，这些都可能提升为 `public`。
- 访问器补完后再跑一次 parse、继承覆写一致性扫描、public 自调用候选扫描和 TypeScript 编译，确认没有把外部调用方法误收窄，也没有保留明显过宽的 public。

建议把以下两类检查沉淀为本地 AST 脚本，或在收口时用一次性 node 脚本执行；结果应为 0，确实需要保留的项要写入进度文档：

- 继承覆写访问器一致性：子类 override 不能比基类契约更宽或更窄。
- 高置信 public 自调用候选：只被本类内部调用、没有动态入口证据的方法不应继续保留 `public`。

## 步骤 4：Cocos 2.4 约束

### 装饰器字段

`@property` 字段名会影响 Cocos 编辑器序列化数据。本轮还原不迁移 Prefab/Scene 绑定，因此只在 TS 代码中恢复字段语义；不要同步修改 prefab、scene、resource 或 `.meta` 里的绑定数据。

### 事件和取消引用

事件注册和注销必须保留同一个函数引用和同一个 target。

```ts
this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
```

同类风险还包括：

- `schedule` / `unschedule`
- `scheduleOnce`
- `cc.callFunc`
- 延迟回调返回的 cancel function
- event emitter subscribe/unsubscribe

如果重命名方法，所有引用点必须一起改。

### Cocos 私有短名

某些短名可能不是业务混淆名，而是 Cocos 引擎内部或编译后私有入口。典型位置是滚动、列表、导航一类通用框架文件。

不要看到 `Di`、`lt`、`Pi`、`Ui`、`Yi` 等短名就直接删除或随意改名。本轮还原更稳妥的做法是保留兼容入口，并在旁边恢复语义方法或注释说明。

## 步骤 5：验证和收口

### 文件数量检查

```bash
node - <<'NODE'
const fs = require('fs');
const ignorePath = 'JS_TO_COCOS24_TS_IGNORE_MODULES.txt';
const ignored = fs.existsSync(ignorePath)
  ? new Set(
      fs.readFileSync(ignorePath, 'utf8')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
    )
  : new Set();
const js = fs.readdirSync('assets/scripts')
  .filter(f => f.endsWith('.js'))
  .map(f => f.replace(/\.js$/, ''))
  .filter(f => !ignored.has(f))
  .sort();
const ts = fs.readdirSync('assets/scripts_ts24')
  .filter(f => f.endsWith('.ts'))
  .map(f => f.replace(/\.ts$/, ''))
  .filter(f => !ignored.has(f))
  .sort();
const missing = js.filter(f => !ts.includes(f));
const extra = ts.filter(f => !js.includes(f));
console.log('active js count:', js.length, 'ts count:', ts.length);
console.log('missing ts:', missing.join(', ') || '(none)');
console.log('extra ts:', extra.join(', ') || '(none)');
if (missing.length) process.exit(1);
NODE
```

### Parse 检查

```bash
node - <<'NODE'
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
let ok = 0;
const bad = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts')) {
      try {
        parser.parse(fs.readFileSync(p, 'utf8'), {
          sourceType: 'module',
          plugins: ['typescript', 'decorators-legacy', 'classProperties']
        });
        ok++;
      } catch (e) {
        bad.push([p, e.message, e.loc]);
      }
    }
  }
}

walk('assets/scripts_ts24');
console.log('parse ok:', ok);
if (bad.length) {
  console.log(JSON.stringify(bad, null, 2));
  process.exit(1);
}
NODE
```

### 阶段完成后的质量抽查

质量抽查放在本阶段所有应翻译脚本完成之后执行，不要求每一批转换后立即达到最终收口标准。分批翻译过程中，后续依赖可能尚未还原，允许存在临时 JS 边界、最小接口或补丁，但必须写入进度文档。

每批脚本翻译完成后，应查找当前已经生成的 `assets/scripts_ts24/*.ts`，把能够替换为 TS 引用的依赖及时替换；如果某个依赖尚未翻译，可以临时继续引用原 JS。阶段完成后的质量抽查再统一确认这些临时引用是否已经收拢，避免长期指向已经完成还原的 JS 文件。

阶段完成后的质量抽查至少覆盖：

- 扣除忽略清单后的 JS/TS 文件数量对账。
- 全量 TS parse 检查。
- 装饰器字段、方法参数、返回值类型缺失扫描。
- 显式 `any`、宽泛 `Function`、可恢复 `unknown` 扫描。
- 原 JS `Class.prototype` / `Object.defineProperty` 与 TS class 的方法、getter、setter 抽查对照。
- 事件、schedule、回调注销引用抽查，确认注册和注销仍使用同一函数引用、target 和 capture 参数。
- 成员访问器抽查，确认 `public` / `protected` / `private` 与外部调用、继承覆写、生命周期和动态调用证据一致。
- `import * as`、编译 helper、机械 `prototype` 残留、可箭头化 callback、可替代业务常量包装扫描。
- 临时 `Runtime`、`RuntimeValue`、`Like`、`Compat`、`Facade`、`Placeholder` 等命名扫描，并收拢为真实类引用、忽略 JS 模块引用或角色命名的边界接口。

抽查结果和仍需保留的动态边界必须写入 `TS_REVERSE_PROGRESS.md`，说明原因、影响范围、后续收口条件和最近验证结果。

### 批次验证工具的规模边界

分批翻译的默认验证方式是复用已经存在的通用检查，不要求、也不允许把“每翻译一个模块就新增一份专用 mock 和行为快照”作为固定流程。批次验证的目标是尽快发现当前改动是否遗漏导出、prototype、访问器、装饰器、类型和关键执行顺序，不是在 TS24 阶段搭建一套脱离 Creator 的完整游戏运行环境。

每批默认只执行以下检查：

- 对当前批次及累计产物执行已有的 parse、类型和静态扫描。
- 对当前批次做原 JS 导出形态、class/prototype、getter/setter 和装饰器字段对照。
- 复用已有通用运行时对照工具时，只传入当前模块范围；普通 model、常量、配置、薄 controller 和宿主转发模块不得因此新增专用行为快照。
- 在进度文档记录实际执行的命令和结果，不以“新增了多少测试代码”作为完成度。

只有静态检查和 prototype 对照无法证明语义一致，并且模块涉及状态机转换、结算或数据变换、资源加载、异步接力、事件注销、对象池生命周期、动画完成回调等高风险行为时，才允许增加最小定向行为检查。增加前必须先写明待验证风险、输入、关键断言和退出条件；检查只覆盖该风险，不扩展为对整个 Cocos、framework 或游戏宿主环境的模拟。

定向行为检查默认按一次性检查处理：优先使用独立的小脚本或临时脚本，验证结果写入进度文档后即可移除。只有同时满足“后续会重复执行”“能稳定发现语义回归”“依赖边界明确”“维护成本明显低于人工回查”时，才保留为项目工具。项目专属业务快照应与通用导出/prototype 检查分离，不得持续堆入同一个单体脚本。

以下做法禁止作为批次默认流程：

- 每翻译一批就扩充 Cocos mock、外部模块 mock 或宿主框架 mock。
- 为每个普通模块建立专属行为快照，或追求所有模块都有行为快照。
- 为运行 mock 而补造与当前风险无关的引擎 API、资源、节点树、协议数据或业务状态。
- 从检查脚本中的参数、标记或函数自动枚举出全部行为检查，并把新增项无审查地纳入永久门禁。
- 让单个验证脚本同时承担模块加载器、完整引擎模拟、外部宿主模拟和大量项目业务快照；出现这种趋势时必须停止扩写，改为缩小检查范围、拆分一次性检查或回到真实运行阶段验证。

阶段门禁冻结后，检查命令集合也必须冻结。收口期间新增的诊断脚本默认只是定位手段，不自动成为门禁；只有它证明了冻结范围内已有的语义阻断项，才修复产物并用原冻结命令复验。不得因为诊断工具还能继续扩写而延长静态收口。

### 阶段静态收口的有限边界

TS24 静态收口是进入 TS3 迁移前的阶段门禁，不是无限期代码优化。进入收口前，必须冻结本阶段文件清单、检查命令和阻断项定义；收口期间不得临时扩大到业务重构、运行表现调整、资源接入、Cocos 3 API 迁移或新架构设计。

收口按固定流程执行：

1. 基线扫描：一次性生成文件数量、parse、类型、prototype/成员、依赖和机械残留结果。
2. 分类：每个命中归为“必须修复”“误报”或“允许保留边界”，不保留未分类结果。
3. 定向修复：只修复本阶段清单中的阻断项，不顺手扩展新目标。
4. 全量复验：重新运行同一组冻结命令；阻断项为零，误报和允许保留边界均已记录，即可结束 TS24 阶段。

以下属于 TS24 必须修复项：

- 扣除忽略清单后，应翻译脚本缺失、额外脚本来源不明或依赖顺序文件缺失。
- TS parse 失败。
- 可从原 JS、装饰器、初始化值、调用点或赋值流恢复的字段、参数、返回值类型缺失。
- 显式 `any`、宽泛 `Function`、可恢复 `unknown` 或无依据的临时占位类型仍存在。
- 相比原 JS 遗漏 prototype 方法、字符串方法名、getter/setter、导出或装饰器字段。
- 事件、schedule、回调、状态机或动画队列的函数引用、target、参数或执行顺序被改变。
- 成员访问级别与跨文件调用、Cocos 生命周期或继承契约冲突。
- 已完成 TS 依赖仍无理由指向原 JS，或存在可清理的编译 helper、机械 prototype 等结构残留。

以下可以作为允许保留边界，不应阻塞 TS24 收口，但必须在 `TS_REVERSE_PROGRESS.md` 记录原因和后续处理阶段：

- 忽略清单模块的 `require(...)` 与 `InstanceType<typeof Module.default>` 边界。
- 已确认的循环依赖和为保持原导出形态保留的 CommonJS 引用。
- 宿主注入、网络/proto/event payload、插件私有入口等真实动态边界使用的角色命名接口或受限 `unknown`。
- 扫描命中但逐条确认不是目标问题的误报。
- prefab/scene/meta 绑定、Cocos 3 API、压缩 class id、编辑器导入和运行表现问题；这些属于后续阶段。
- 不影响语义一致性的命名偏好、架构重构、DTO 大范围合并、性能优化和纯代码风格偏好。

静态收口不要求所有 `rg` 命中机械清零，而要求每个命中都有确定结论：真实阻断项清零，误报和允许保留边界有记录。不得为了清零扫描而伪造类型、修改资源、加入 shim、扩大忽略清单、提前迁移 Cocos 3 API 或改变业务语义。

复验时发现冻结清单以外的问题，应先写入进度记录并归入后续阶段。只有它能证明当前 TS24 产物不完整、不可 parse 或与原 JS 语义不一致时，才升级为当前阻断项；不得仅因“还能继续优化”而延长静态收口。

### Cocos 2 API 保留确认

本轮还原允许保留以下内容，它们不是本轮还原问题：

- `cc._decorator`
- `cc.Component`
- `cc.Node`
- `cc.ParticleSystem`
- `node.x` / `node.y`
- `node.width` / `node.height`
- `node.opacity`
- `runAction`
- `stopAllActions`
- `cc.sequence`
- `cc.spawn`
- `cc.callFunc`
- 字符串形式 `getComponent("SomeComponent")`

如果这些内容在本轮还原中被大规模替换，反而要警惕是否偏离了“语义还原优先”的目标。

### 收口标准

本轮还原完成时，应达到：

- 游戏主逻辑脚本都有对应 TS。
- 默认不逆向清单已记录，并确认没有被主流程强依赖。
- 字段、参数、返回值的类型缺失扫描通过。
- 还原过程中的临时接口已替换为真实脚本引用类型；临时 `RuntimeValue` / `Runtime` / `Like` / `Compat` / `Facade` / `Placeholder` 等类型命名已清理。确实存在的动态边界使用角色命名接口，并限定使用范围。
- 类成员函数已基于全局调用图和继承图补齐 `public` / `protected` / `private`，且继承覆写访问级别一致，高置信 public 自调用候选已清零或记录保留原因。
- 依赖顺序文件存在，并记录依赖环。
- 关键业务文件已做 prototype 对照。
- 核心流程文件已恢复主要语义命名。
- 短 `this.xx` 和短 method 残留已扫描并记录。
- `import * as`、编译 helper、`prototype` / `Object.defineProperty` 机械残留、可箭头化 `function` callback、可替代业务常量包装都已扫描并清理；确实保留的 descriptor wrapper 或动态 receiver 函数已记录原因。
- 事件、schedule、回调注销引用未被破坏。
- README、迁移记录或 `TS_REVERSE_PROGRESS.md` 中写明已知风险和暂缓处理文件。

完成标准是“语义稳定、主要类型明确、可继续维护的 Cocos 2.4 TS”。缺失字段类型、缺失参数类型、缺失返回类型都视为未完成项。

## 常见反复点

- 把 JS 到 Cocos 2.4 TS 和其他范围外改造混在一轮做。
- 只还原挂在节点上的组件脚本，漏掉 helper/model/state。
- 看到短名就全局替换，破坏 Cocos 私有入口或回调引用。
- 改了 `on/off`、`schedule/unschedule` 两边的函数引用。
- default export、named export、`export =` 判断错误。
- 依赖环被 ES import 改法打断。
- 在状态机、动画队列或 slot 流程里顺手重构执行顺序。
- 默认不逆向文件被当成重点文件反复攻坚。
- 只因文件名相同就直接复制其他项目的源码，没有核对当前 JS 的结构和行为。
- 搜索当前项目之外的同类项目时没有提前说明检索范围，也没有记录逐文件来源。
- 参考项目与当前游戏存在配置或业务差异，却错误地以参考源码覆盖当前 JS。
- 给忽略 JS 组件重复声明本地接口，而不是直接引用原 JS 模块。
- 全量完成后忘记收拢 `*Runtime` / `Like` / `Compat` 等临时命名。
- 基类模板钩子在子类里仍保留 `public`，导致访问器边界过宽。
- 只检查“是否有访问器”，没有检查继承覆写访问级别是否一致。
- 把只在本类回调链中使用的方法因为 `bind` / `schedule` / `cc.callFunc` 保守留成 `public`。
- 用业务包装常量替代 Cocos 2.4 内置枚举，例如动画完成事件。
- 全量 Prettier 后忘记恢复 class member 空行，导致 `@property` 字段和运行时字段挤在一起。
