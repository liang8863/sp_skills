# Slot FE Client 工作流常用目录与概念

本文是多 Agent 工作流的常用目录、固定概念和路由约束。Agent 在处理 Slot FE Client、YJZR、资源工程、MCP 或 Git 相关任务时，先读本文件，再读具体任务文档。

## 常用目录

| 概念 | 路径 | 用途 |
| --- | --- | --- |
| Codex 配置目录 | `E:\CCCCCC\slot-fe-client\.codex` | 存放 Codex 的项目级配置、skills、agents、hooks、references 等。 |
| 输出文档目录 | `E:\CCCCCC\slot-fe-client\docs` | 存放需求、分析、QA、流程等输出文档；新文档应按较粗粒度分类建文件夹。 |
| 资源项目 | `E:\CCCCCC\UIProj\387Proj\NewProject` | 反编译竞品的资源和代码所在项目，doc man 和 asset man 优先作为参考来源。 |
| 项目根目录 | `E:\CCCCCC\slot-fe-client` | Slot FE Client 仓库根目录。 |
| 游戏实例目录 | `E:\CCCCCC\slot-fe-client\games` | 各个 Cocos 游戏实例项目；当前在研重点是 `yjzr`，其余已开发项目可作为参考。 |

## 文档输出规则

- 输出文档默认放入 `E:\CCCCCC\slot-fe-client\docs`。
- 不要把所有文档平铺到 `docs` 根目录；按较粗粒度分类建文件夹，例如 `requirements`、`visual-audit`、`qa`、`resource-inventory`、`workflow`。
- 文档文件名优先包含游戏名、主题和日期，便于后续检索。
- 如果文档是给 agent 工作流复用的规则，优先放入 `.codex/references`，并按需同步一份用户可读版本到 `docs`。

## 资源项目规则

- `E:\CCCCCC\UIProj\387Proj\NewProject` 是资源项目默认地址。
- doc man 跑竞品时，应同时比对资源项目和旧逻辑，避免只凭截图写需求。
- asset man 查资源时，应优先从资源项目确认 prefab、spine、atlas、material、shader、animation、audio 和旧代码流程。
- cocos man 确认资源齐全后，应到资源工程通过 Cocos 资源 export/import 导入目标工程，避免 meta、UUID、material、shader、prefab 关联丢失。

## 游戏目录规则

- `E:\CCCCCC\slot-fe-client\games` 存放各个游戏实例。
- 当前在研项目是 `games/yjzr`。
- 其他已开发项目可作为实现方式、资源接入和架构参考，但不能直接覆盖当前游戏需求。
- 进入任何游戏实例前，先确认实际 cwd、git top-level、Cocos MCP 连接项目名和项目路径。

## Agent 工作流默认值

- PM 短句唤醒默认读取 `E:\CCCCCC\slot-fe-client\.codex\agent-team.yaml` 的 `workflow_defaults`。
- 推荐短句：`@pm-agent 启动 工作流：修复 xxx 问题`。
- 未填写的项目、允许调度 agent、参考资料、竞品链接、期望交付和停止条件由 `workflow_defaults` 补齐。
- 项目基础信息默认参考 `E:\CCCCCC\slot-fe-client\docs\project-basic-info.md`；PM 建任务卡或派发子任务前应读取它，除非当前任务明确覆盖项目上下文。
- 用户当前消息中明确写出的字段优先级最高，会覆盖默认值。
- 如果默认值会造成产品、资源、排期、权限或实现风险，PM 必须暂停并向需求方确认。

## Cocos Creator MCP 端口约定

| 项目 | 端口 |
| --- | --- |
| `yjzr` | `30001` |
| `yjzr-01` | `30002` |
| `yjzr-02` | `30003` |
| `yjzr-03` | `30004` |

端口按 `yjzr` 为 `30001`、`yjzr-01` 为 `30002` 的规则继续递增。如果遇到项目 MCP 配置不符合该约定，应在确认目标项目后修改对应项目的 MCP 配置，并重新验证 projectName、projectPath、active scene 和 console/log 状态。

## Git 操作路由约束

- 所有 Git 修改操作优先交给 `git-agent`，包括 branch switch、stash、rebase、merge、conflict resolution、stage、commit、tag、push、reset、cherry-pick、revert。
- Git 只读操作可以选择最快、最简单的方式，例如 `git status`、`git diff`、`git log`、`git show`、`git branch -vv`。
- 只读检查一旦需要进入修改动作，应切换到 `git-agent` 流程。
- 不要在脏工作区里用宽泛的 `git add .`，除非用户明确要求收全部变更。
- 不要自动 push；只有用户在当前请求明确要求推送或触发打包时才执行远端写入。
