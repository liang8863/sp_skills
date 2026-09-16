---
name: cocos-mcp-workflow
description: Funplay Cocos MCP connection and usage workflow for Slot FE Client. Use when validating whether Cocos MCP is available, checking Cocos Creator console/project logs, reading MCP resources, listing Cocos MCP tools, running editor or scene JavaScript, taking screenshots, inspecting active scene/runtime state, or when the normal MCP wrappers return empty but the local Funplay MCP server may still be reachable.
---

# Cocos MCP Workflow

## Purpose

Use this skill to verify and operate the local Funplay Cocos MCP server from Codex, especially for `games/yjzr` Cocos Creator 3.8 work. Prefer MCP/Cocos logs over `npx tsc` for YJZR validation.

## Discovery Order

1. When a target Cocos project is known, read `<target-project>/funplay-cocos-mcp.config.json` before using wrappers or a remembered port. Its valid non-empty `host` and integer `port` from `1` through `65535` define the target's configured endpoint. For example:

```powershell
$targetProject = 'D:\\WorkSpace\\slot-fe-client\\games\\slot-fe-flp'
$cocosMcpConfigPath = Join-Path $targetProject 'funplay-cocos-mcp.config.json'
$cocosMcpConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath $cocosMcpConfigPath | ConvertFrom-Json
$cocosMcpHost = [string]$cocosMcpConfig.host
$cocosMcpPort = [int]$cocosMcpConfig.port

if ([string]::IsNullOrWhiteSpace($cocosMcpHost) -or $cocosMcpPort -lt 1 -or $cocosMcpPort -gt 65535) {
  throw 'Invalid funplay-cocos-mcp.config.json host or port'
}

$cocosMcpEndpoint = "http://${cocosMcpHost}:$cocosMcpPort/"
```

If the project config is missing or invalid, record that state and continue with the remaining discovery steps. Do not make the configuration file a blocker, but do not substitute a different project's endpoint. A configured endpoint only identifies where to connect; initialize it and verify the returned Cocos/Funplay project identity before accepting logs, scene state, or screenshots as target runtime evidence.

2. Try the built-in MCP wrappers:

```text
functions.list_mcp_resources({})
functions.list_mcp_resource_templates({})
```

3. If wrappers return empty or target a different endpoint, inspect Codex config:

```powershell
codex mcp list
codex mcp get funplay_cocos
Get-Content "$env:USERPROFILE\.codex\config.toml" -Raw
```

4. Only when no valid target-project config is available, a conventional fallback Cocos server is:

```toml
[mcp_servers.funplay_cocos]
url = "http://127.0.0.1:8765/"
```

For that fallback only, set `$cocosMcpEndpoint = 'http://127.0.0.1:8765/'` before running the HTTP examples below.

If a stdio MCP entry points to a missing executable, report that entry as unavailable without treating the Cocos MCP as failed.

## HTTP MCP Handshake

Funplay Cocos MCP uses Streamable HTTP. `GET` returning `405 Method Not Allowed` is not a failure. `POST` without the required `Accept` header returning `406 Missing Accept header` also means the service is alive.

Use this minimal PowerShell check:

```powershell
$headers = @{
  Accept = 'application/json, text/event-stream'
  'MCP-Protocol-Version' = '2025-06-18'
}

$body = @{
  jsonrpc = '2.0'
  id = 1
  method = 'initialize'
  params = @{
    protocolVersion = '2025-06-18'
    capabilities = @{}
    clientInfo = @{ name = 'codex-check'; version = '0.1.0' }
  }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri $cocosMcpEndpoint `
  -Method POST `
  -ContentType 'application/json' `
  -Headers $headers `
  -Body $body `
  -TimeoutSec 8
```

Healthy YJZR response should identify a server similar to:

```json
{
  "serverInfo": { "name": "Funplay Cocos MCP - yjzr", "version": "0.4.0" },
  "funplay": { "server": "funplay-cocos-mcp", "projectName": "yjzr" },
  "capabilities": { "tools": {}, "resources": {}, "prompts": {} }
}
```

## List Available MCP Surface

After initialize, list what the server exposes:

```powershell
$headers = @{
  Accept = 'application/json, text/event-stream'
  'MCP-Protocol-Version' = '2025-06-18'
}

function Invoke-CocosMcp($id, $method, $params) {
  $body = @{ jsonrpc = '2.0'; id = $id; method = $method; params = $params } |
    ConvertTo-Json -Depth 20

  Invoke-WebRequest -Uri $cocosMcpEndpoint `
    -Method POST `
    -ContentType 'application/json' `
    -Headers $headers `
    -Body $body `
    -TimeoutSec 10
}

Invoke-CocosMcp 2 'tools/list' @{}
Invoke-CocosMcp 3 'resources/list' @{}
Invoke-CocosMcp 4 'resources/templates/list' @{}
Invoke-CocosMcp 5 'prompts/list' @{}
```

Common useful tools:

- `execute_javascript`: primary flexible tool. Use `context="editor"` for Editor APIs and asset-db workflows, `context="scene"` for live runtime inspection.
- `get_recent_logs`, `search_project_logs`: read Cocos/MCP/project logs.
- `get_scene_info`, `get_hierarchy`, `find_nodes`, `inspect_node`: inspect active scene.
- `inspect_prefab`, `validate_prefab_references`, `apply_prefab_instance`: prefab workflows.
- `capture_game_screenshot`, `capture_scene_screenshot`, `capture_editor_screenshot`: visual validation.
- `simulate_button_click`, `simulate_preview_input`: runtime interaction validation.
- `refresh_assets`: after creating, moving, or deleting Cocos assets.
  - If refresh/editor activity creates an untracked `assets/.meta` directory meta file and it does not affect the task, leave it alone during active debugging and decide whether to delete or stage it before commit.

Common resources:

- `cocos://project/context`
- `cocos://project/summary`
- `cocos://scene/active`
- `cocos://selection/current`
- `cocos://errors/scripts`
- `cocos://logs/project`
- `cocos://logs/editor`
- `cocos://mcp/interactions`

Common templates:

- `cocos://scene/node/{path}`
- `cocos://asset/path/{relative_path}`
- `cocos://asset/info/{uuid_or_path}`

## Visual Screenshot Acceptance

For Cocos UI, animation, prefab, reel presentation, BigWin, bonus, and transition changes, finish with a visual acceptance pass whenever MCP/browser access is available:

1. Start or focus the real preview first. Use `run_project_preview`, then `get_build_status` to find the preview URL. Prefer the browser/preview runtime over Editor-only scene state for final visual proof.
2. Drive the game into the target state. If real server data is hard to obtain, temporarily trigger runtime-only data in memory through public component methods or event handlers, such as a representative free-game payload. Do not write or commit validation-only server fixtures unless the user asks for that.
3. Capture screenshots for the meaningful states: before/entry, target visual, and after/dismiss/next panel. Save descriptive files under `temp/mcp-captures`, for example `chrome-bonus-loading-ready-runtime.png`.
4. Inspect the screenshots, not only the returned tool status. Confirm the image is nonblank, correctly framed, and matches the relevant `doc/` effect images or requirement notes.
5. Validate runtime state with `execute_javascript`, such as active nodes, component names, callback completion flags, and important UI values. For Editor scene scripts where the scheduler does not naturally advance, manually tick `cc.director.tick(1 / 60)` in a bounded loop only for validation.
6. Check browser console, Cocos project logs, and MCP recent logs after the interaction. Report new errors related to the change; call out unrelated pre-existing asset/API errors separately.
7. Clean up temporary runtime state before finishing when possible, for example by calling the component cleanup method and hiding the test node. Do not leave the preview in a misleading forced state.

## Read Resources And Call Tools

Read a resource:

```powershell
Invoke-CocosMcp 10 'resources/read' @{ uri = 'cocos://logs/project' }
Invoke-CocosMcp 11 'resources/read' @{ uri = 'cocos://errors/scripts' }
```

Call editor JavaScript:

```powershell
Invoke-CocosMcp 12 'tools/call' @{
  name = 'execute_javascript'
  arguments = @{
    context = 'editor'
    code = 'return { ok: true, hasEditor: typeof Editor !== "undefined" };'
  }
}
```

Call scene JavaScript:

```powershell
Invoke-CocosMcp 13 'tools/call' @{
  name = 'execute_javascript'
  arguments = @{
    context = 'scene'
    code = 'return { ok: true, hasCc: typeof cc !== "undefined" };'
  }
}
```

Avoid browser-only globals such as `location` in editor scripts unless the context proves they exist.

## Interpretation Rules

- `codex mcp list` shows `funplay_cocos` enabled plus initialize succeeds: MCP is available.
- Built-in `list_mcp_resources` returning empty does not prove the MCP server is down; fall back to direct Streamable HTTP JSON-RPC.
- Editor context succeeding with `hasEditor: true` proves Editor-side MCP is usable.
- Scene context or `cocos://scene/active` timing out usually means preview/runtime scene state is not ready or the Editor is busy. Try `get_recent_logs`, `get_project_info`, `open_scene`, `run_project_preview`, or read `games/yjzr/temp/logs/project.log` as fallback.
- `cocos://errors/scripts` returning `Script diagnostics failed: spawn EINVAL` means the diagnostic helper failed, not necessarily that the project scripts failed.
- For YJZR, do not switch to `npx tsc` just because MCP diagnostics failed. Use Cocos logs/MCP logs/project logs and state when direct console validation is incomplete.

## Fallback Log Reading

When MCP is unavailable or scene calls keep timing out:

```powershell
Get-Content games/yjzr/temp/logs/project.log -Tail 220
```

Report the exact limitation, for example: "MCP initialize succeeded, editor context works, but scene context timed out; validation used project log tail instead."
