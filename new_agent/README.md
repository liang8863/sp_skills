# Slot Agent MVP

这是一个独立的本地 Web 原型，用来演示 Slot Agent Platform 的第一条闭环：

`项目盘点 -> 证据归一化 -> 规格草案 -> Patch Plan -> R2 审批 -> 模拟执行 -> 验收报告`

## 启动

```powershell
cd D:\WorkSpace\slot-fe-client\.codex\new_agent
npm.cmd start
```

然后打开 <http://localhost:4173>。

本原型只使用 Node.js 内置模块，没有把 API key 写入项目，也不会默认连接真实项目或外部网站。`src/adapters/` 中的适配器已经接入 Codex App Server 的 stdio JSONL 协议，并保留 Cocos MCP 的配置边界。

## Harness 模式

页面顶部的“连接 Harness”会启动本机 `codex app-server --listen stdio://`，完成 `initialize`/`initialized` 握手，但不会启动模型 turn。连接后点击“运行 Harness 分析”，第一阶段会用 `readOnly` sandbox 读取试点项目并把 thread/turn 事件写入活动记录；R2 写入仍由 Slot Agent 的审批队列控制。

可选环境变量：

```powershell
$env:CODEX_BIN = 'codex.cmd'             # 默认 Windows 使用 codex.cmd
$env:SLOT_AGENT_MODEL = 'gpt-5.6-sol'   # 默认模型
$env:SLOT_AGENT_PORT = '4173'
$env:COCOS_MCP_COMMAND = 'funplay-cocos-mcp'
```

真实 harness 模式需要本机 `codex` 命令可用，并沿用 Codex 的用户级认证；浏览器不会接触 API key。若 App Server 不可用，页面会保持模拟执行器，不会假装已经调用模型。

## 演示流程

1. 点击“运行分析”，观察左侧工作流从盘点推进到“等待审批”。
2. 在右侧审批队列点击“批准并继续”，观察实现和验收阶段完成。
3. 点击“采集示例证据”可以追加一条手工证据，随后会出现在证据流中。
4. 点击“重置演示”恢复初始状态。

## 目录

```text
  src/
  contracts.js                 # 领域对象和状态工厂
  store.js                     # 内存状态、事件和审计记录
  workflow.js                  # 可暂停的 evidence -> patch -> verify 工作流
  server.js                    # Node HTTP API 与静态文件服务
  adapters/
    codex.js                   # Codex App Server stdio JSONL 客户端与只读 turn
    cocos-mcp.js               # Cocos MCP 配置与能力边界
public/
  index.html
  app.js
  styles.css
```
