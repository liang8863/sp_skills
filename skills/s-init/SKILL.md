---
name: s-init
description: Initialize and sequentially execute an evidence-driven Slot replication when the user explicitly invokes @s_init, @s-init, or $s-init. Prepare the full-stack roadmap, sample the competitor for separate client and server detailed plans, then complete the server goal before client work.
---

# s-init

Follow `<slot-fe-client-root>/.codex/agents/s-init-agent/AGENT.md`. This skill coordinates initialization and two formal implementation goals. It never edits gameplay code directly; it delegates server writes to `s_ser` and client writes to `s_cli` only after their Gates pass.

## Browser access

When the workflow needs to open, inspect, or interact with a web page, use the
`chrome_devtools` MCP exclusively. This includes competitor observation, Network evidence,
simulator visual checks, and an environment game-route check. Do not invoke the `browser` or
`browser:control-in-app-browser` skill, or substitute another browser-control wrapper. This
does not replace Cocos MCP for editor/scene/console inspection, nor direct HTTP checks for
server contracts. If `chrome_devtools` is unavailable, preserve the non-browser evidence and
report `NEEDS_CHROME_DEVTOOLS` for the blocked browser evidence rather than changing tools.

Every Chrome MCP session has a mandatory ownership, mute, and cleanup lifecycle:

1. Before opening the task URL, call `list_pages` and record the baseline page IDs. Use a new,
   task-owned page, preferably in a task-specific isolated context; do not repurpose an
   unrelated pre-existing page.
2. An `s_init` invocation grants default authorization, without a separate confirmation, to
   make the minimum idempotent change needed to the active Chrome DevTools MCP configuration
   so its dedicated browser instance starts muted. First inspect the effective MCP source. If
   it is not already muted, edit only that server's mute-related launch argument or setting,
   such as adding the supported Chrome `--mute-audio` argument through the existing MCP
   wrapper. Preserve the command, unrelated arguments, environment, credentials, other MCP
   servers, comments, and formatting; do not install, update, replace, or broadly reconfigure
   Chrome, Codex, or the MCP server. Re-read the setting after the write and do not write when
   an equivalent mute setting already exists. If activation requires a host-wide restart or
   another action that cannot be scoped to the task-owned MCP server/instance, return
   `NEEDS_CHROME_MCP_RELOAD` rather than performing it implicitly.
3. Mute the dedicated Chrome MCP browser instance before loading any target that may play
   audio, using the verified instance-level launch/configuration or MCP mute mechanism. Verify
   the mute state before interaction. Muting only an HTML media element is not sufficient for
   games that may use WebAudio. If instance-level mute cannot be applied or verified, return
   `NEEDS_CHROME_MUTE` and do not navigate to or operate the target.
4. Track every page or popup created by the task. Put browser work in a cleanup-safe flow: on
   success, failure, timeout, or blocked exit, first stop any active trace and save required
   evidence, then close all task-owned pages in reverse creation order with `close_page`. If
   the task launched a dedicated Chrome instance and an ownership-specific shutdown is
   available, close that instance after its pages.
5. Call `list_pages` after cleanup and verify that no task-owned page remains. Never close a
   baseline page or terminate Chrome by broad process name. If the MCP cannot close its last
   task-owned page and cannot shut down the dedicated instance, report
   `CHROME_CLEANUP_FAILED` with the remaining page/instance identity; do not claim browser
   acceptance or silent cleanup.

## Canonical boundary

- Resolve exactly one target at `<slot-fe-client-root>/games/slot-fe-{replicationId}`. The project slug is the replication ID used by `{replicationId}_res` and `slot-be-runner-{replicationId}`; a legacy provider/wire `gameId` in `project_info.md` may differ and must be recorded separately. Reject targets outside the direct `games/` children and paths that traverse reparse points.
- Treat these as the canonical client inputs:
  - `<project>/doc/project_info.md`
  - `<project>/doc/js_scripts/`, containing at least one real `.js` file
  - `<project>/doc/project_plan.md`
- Use `<project>/assets/resources/{replicationId}_res/` as target-local supporting evidence when it contains at least one ordinary file and as the required local-resource handoff for later `s_cli` work. A missing or empty root adds a plan Gate but does not block a JS/runtime-based `DRAFT_EVIDENCE_GATED` plan. Never inspect an external resource project, `CC3Proj`, sibling `*_UI`, or another game as competitor evidence.
- Put every document, capture, log, plan, and execution artifact created by this coordinated workflow under `<project>/doc/`. In `s_init execution` mode, `s_ser` also writes its task documents and runtime evidence below `<project>/doc/s_init/server/`, not in the runner. `s_cli` keeps its formal task documents below `<project>/doc/s_cli/`.
- Before implementation starts, the only writes outside the target client's `doc/` are the narrowly authorized Chrome DevTools MCP mute-setting adjustment above and cloning a missing runner to `<slot-fe-client-root>/games/Server/slot-be-runner-{replicationId}`. During the two formal goals, only delegated `s_ser` server/simulator code writes and delegated `s_cli` target-client code writes are allowed.

## Workflow

Run `RESOLVE -> INVENTORY -> BOOTSTRAP_PROJECT_INFO -> ENSURE_RUNNER -> VERIFY_SERVER_BASELINE -> GATE_INPUTS -> OBSERVE -> PLAN -> TARGETED_SAMPLE -> CLIENT_DETAIL_PLAN -> SERVER_DETAIL_PLAN -> DETAIL_PLAN_GATE -> SERVER_GOAL -> CLIENT_GOAL -> REPORT`.

### 1. Resolve and inventory

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<slot-fe-client-root>/.codex/skills/s-init/scripts/inspect-init-state.ps1" -ProjectPath "<project>"
```

The inventory must distinguish a missing path from an invalid path and an empty `doc/js_scripts/` directory. Do not create an empty directory to satisfy the JavaScript Gate.

### 2. Bootstrap project metadata

- Missing `doc/project_info.md`: use an absolute HTTP(S) competitor URL already supplied in the request. Otherwise return `NEEDS_PROJECT_INFO_INPUT` and ask one concise question for the URL only. Resolve the replication ID from the required `slot-fe-{slug}` project name; do not confuse it with a provider/wire game ID stored by legacy metadata. Create the file once with `<slot-fe-client-root>/.codex/skills/s-cli/scripts/initialize-project-info.ps1 -AllowMissingResourceForSInit`, passing `-GameId <metadataGameId>` only when a valid provider/wire ID is already explicit in the request; otherwise omit it so the initializer records the project slug. Then rerun inventory. Never overwrite an existing file. This narrow switch lets `s_init` record a resource gap in a draft; normal `s_cli` initialization still requires `{replicationId}_res`.

Do not continue to an external write until `project_info.md` is valid.

### 3. Ensure the server runner

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<slot-fe-client-root>/.codex/skills/s-init/scripts/ensure-runner.ps1" -ProjectPath "<project>"
```

The script derives `Server` from repository topology, never from the caller's current directory. If the destination is absent, it executes exactly one SSH clone using:

```text
git clone -- git@github.com:jp-sunshine/slot-be-runner-{replicationId}.git <server-root>/slot-be-runner-{replicationId}
```

Do not preflight with `ssh -T`, retry automatically, or fall back to HTTPS. Clone non-interactively with a bounded 180-second timeout; terminate only the owned clone process tree on timeout, and preserve any partial destination for manual inspection. For an existing runner, validate its Git top level and GitHub repository identity, record whether it is dirty, and keep it read-only. Never fetch, pull, reset, stash, clean, switch branches, delete, or re-clone an existing path. Stop on a file/directory collision, reparse point, wrong top level, wrong origin, failed clone, or partial clone.

Clone success establishes only that server source is locally available. It does not prove that the runner builds, starts, matches the client, or passes `s_ser` acceptance.

### 4. Verify the server baseline

After the repository Gate, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<slot-fe-client-root>/.codex/skills/s-init/scripts/inspect-server-baseline.ps1" -ProjectPath "<project>"
```

The runner must contain an implementation-ready baseline: a valid Go module, a real executable entry point, runtime configuration, and auditable non-test game/module source. This check is read-only and may accept donor identity before the identity-migration task; it must not confuse an existing Git repository, a successful clone, or a lone `go.mod` with usable base code. If the baseline is incomplete, return `NEEDS_SERVER_BASE_CODE`, list the exact missing capabilities, ask the user to initialize the runner foundation, and stop before either implementation goal. `s_init` must not invent or copy a server foundation from a sibling runner.

### 5. Gate local planning inputs

- Missing or empty `doc/js_scripts/`: return `NEEDS_JS_SCRIPTS` and identify the exact directory. Ask the user to import the archived competitor JavaScript. Do not fabricate scripts, scrape them implicitly, or treat an empty folder as ready.
- Missing `doc/project_plan.md`: treat the `s_init` invocation itself as authorization to create it without a separate confirmation. Record `NEEDS_PROJECT_PLAN_CREATION` with the `CREATE_PROJECT_PLAN` action, continue through observation and contributor planning once the other Gates are ready, then create exactly one roadmap using `references/project-plan-contract.md`. Never create a second plan, overwrite an existing plan, or replace an existing file during this automatic path. When a valid plan is already present, report the `PROJECT_PLAN_EXISTS` action, validate and reuse it; updating it is a separate, explicitly requested review task.
- Existing `doc/project_plan.md`: validate the ordered contract sections, required Identity metadata, and every required non-empty contract table. Return `NEEDS_PROJECT_PLAN_REVIEW` for blank, skeletal, truncated, mismatched, or obsolete content; never call an arbitrary file ready merely because it exists. Evidence-gated rows containing `UNKNOWN` remain valid.

Consolidate missing-item prompts when possible. Do not generate the plan until `js_scripts/`
contains JavaScript, but do not ask for project-plan creation confirmation.
`NEEDS_PROJECT_PLAN_CREATION` is an automatic action state, not a stop state.

### 6. Observe the competitor

- Read the full URL from `doc/project_info.md` only for the live, read-only observation session. Use `competitor-requirement-analysis` for reproducible observation and preserve captures under `<project>/doc/s_init/evidence/`.
- In every `s_init` observation phase, use `competitor-requirement-analysis` for capture discipline only. Its fixed 500-spin, 300-status-bar, and 20-multiplier-event completion thresholds do not apply; the scenario-screenshot Gate in step 8 is authoritative.
- A URL string is an evidence locator, not proof of behavior. Only observed page/runtime state may be recorded as `competitor-runtime` evidence.
- Never write signed query parameters, tokens, or secrets into new documents. Refer to `doc/project_info.md` and record only a redacted origin/path in the plan.
- If runtime access is unavailable, keep affected rows `UNKNOWN`, add `NEEDS_RUNTIME_EVIDENCE`, and produce only `DRAFT_EVIDENCE_GATED`. Do not promote inferred behavior to confirmed.

### 7. Build the full-stack plan

Read `<slot-fe-client-root>/.codex/agents/s-cli-agent/references/slot-function-reference.md` as a coverage checklist only. It cannot establish game behavior, field meaning, timing, payout rules, or protocol semantics.

Use only these evidence classes for competitor behavior:

- `legacy-script`: files below `doc/js_scripts/`
- `local-resource`: files below `assets/resources/{replicationId}_res/`
- `competitor-runtime`: reproducible observations captured from the configured URL

Current target client/server code, raw responses, tests, and README files may establish the target baseline or a current contract; they do not establish competitor behavior. `project_info.md` is metadata only.

Select planning contributors according to the evidenced scope. A cross-end replication normally needs both; a genuinely single-end scope may use only the matching contributor, while the other workstream remains explicit as evidenced `N/A`, `UNKNOWN`, or a Gate:

- `s_cli` in `s_init planning contribution` mode returns client modules, candidate owners, dependencies, verification, acceptance, and client-side gaps. Its Reel coverage separates Reel core, Reel background, Drop peeking, Spin peeking, and Elimination; each item records its VFX/effect, animation/timing, audio, completion callback, cleanup, evidence state, `{replicationId}_res` Prefab replacement decision, and new Prefab property/transform decision. A replacement starts from the target resource Prefab's serialized values; old Prefab properties are not copied unless target-local resource, archived JS, or runtime competitor evidence proves a specific adjustment. It remains read-only, creates no `doc/s_cli/**`, and does not browse the URL itself.
- `s_ser` in `s_init planning contribution` mode returns runner baseline, candidate producer/contract boundaries, fixtures, tests, simulator needs, and server-side Gates. It remains read-only and writes no runner documentation.
- `s_init` merges both results into the single client-owned `doc/project_plan.md` using `references/project-plan-contract.md`.

The plan is a full-stack roadmap, not an executable `s_cli` version 2 `plan.json` and not a frozen `s_ser` contract. Unknown wire fields must remain semantic placeholders until raw/provider evidence exists. Cross-end implementation is strictly serial: the server identity, contract, rules, fixtures, simulator, and coexistence goal MUST complete before a client implementation goal is created. `READY_FOR_HANDOFF` authorizes the targeted sampling and detailed-planning stage only; it does not authorize implementation.

### 8. Sample the competitor for both detailed plans

After `doc/project_plan.md` has been generated and validated, read `references/detailed-plan-contract.md`. Derive separate client and server sampling checklists from the roadmap workstreams and acceptance matrix, then use `competitor-requirement-analysis` for a targeted live, read-only observation pass.

- In `s_init` mode, this scene-coverage rule overrides the hard spin/event-count Gates in `competitor-requirement-analysis`. Do not require 500 spins, 300 status-bar observations, 20 multiplier events, any fixed number of Spin attempts, or any fixed occurrence count for a win tier or Free Game.
- Capture one clearly identifiable screenshot for each of exactly three baseline scenarios: Free Game entry, Free Game in-progress runtime, and Free Game exit. One representative screenshot per scenario is sufficient; capture more only when needed to distinguish materially different states, not to meet a quota. The optional scene screenshots are Drop peeking, Spin peeking, Big Win, Mega Win, and Super Mega Win; treat them as separate supplemental evidence only when the roadmap explicitly needs them. They must not block the baseline sampling Gate, either detailed plan, or an implementation Goal. Normal Spin screenshots are outside the `s_init` sampling checklist and must not be collected merely to satisfy sampling.
- Save the screenshots and their date, viewport, action sequence, mode, and reproducibility limits below `<project>/doc/s_init/evidence/client/`. Optional sanitized Network/request/raw-response artifacts may be saved below `<project>/doc/s_init/evidence/server/` and cited by either detailed plan, but they are not required to pass this screenshot-sampling Gate and screenshots alone do not prove protocol fields.
- When browser access is blocked or any required scenario screenshot is missing, preserve the partial artifacts and a scenario coverage matrix, add `NEEDS_TARGETED_COMPETITOR_SAMPLE`, generate both detailed plans as `DRAFT_EVIDENCE_GATED`, and stop before creating the server Goal. Do not replace a missing screenshot with a click count, URL, asset name, sibling-game evidence, or inference.

### 9. Generate separate client and server detailed plans

Dispatch each contributor separately after targeted sampling:

- `s_cli` in `s_init detailed planning contribution` mode returns the client implementation breakdown, evidence-to-owner mapping, state/timing and cleanup rules, server-fixture dependencies, Cocos/static/runtime/visual acceptance, and client Gates. Every client detailed plan contains the five-row Reel module choreography matrix, preserving the evidenced `{replicationId}_res` Prefab replacement and new-Prefab property/transform decisions plus the VFX-animation-audio-callback relationship per row. New Prefab values remain resource-defined unless specific target-local replication evidence proves an adjustment.
- `s_ser` in `s_init detailed planning contribution` mode returns the protocol/rule/state mapping, fixture and deterministic-seed matrix, persistence/queue/math work, tests, simulator/coexistence acceptance, and server Gates.

`s_init` writes the returned plans to `<project>/doc/s_init/client/detailed-replication-plan.md` and `<project>/doc/s_init/server/detailed-replication-plan.md`. Keep them separate and conform both to `references/detailed-plan-contract.md`; do not collapse them back into `project_plan.md`. The contributors remain read-only and neither plan is implementation authorization.

Both files must bind to the exact `project_plan.md` SHA-256 and current owning-repository baseline. Do not open an implementation Goal unless both say `detailedPlanState: READY_FOR_EXECUTION`, map every in-scope roadmap task and acceptance item, contain every required scenario screenshot, and contain no behavior/protocol-blocking Gate. A changed roadmap or relevant Git baseline returns `NEEDS_DETAILED_PLAN_REFRESH`.

### 10. Open the execution contract

Implementation may start only when all initialization inputs and the server baseline are ready, `project_plan.md` has `planState: READY_FOR_HANDOFF`, and both detailed plans pass `references/detailed-plan-contract.md` with `detailedPlanState: READY_FOR_EXECUTION`. Read `references/execution-contract.md`, create or update `<project>/doc/s_init/execution-state.md`, and bind the run to all three plan hashes plus current client and server Git baselines. A draft, blocked, missing, or stale plan remains documentation only.

Use one product goal at a time. Use `/goal` through the available goal mechanism; when `create_goal` is available, create a concrete objective only after confirming that no unfinished unrelated goal would be replaced. Do not emulate a goal with an ordinary checklist when the goal mechanism is unavailable. Return `GOAL_CONFLICT` or `GOAL_TOOL_UNAVAILABLE` instead.

### 11. Complete the server goal first

Create the server goal, then dispatch `s_ser` explicitly in `s_init execution` mode. The goal contains these non-skippable phases:

1. Migrate server identity to `replicationId` before game-rule work. Inventory and update owned runtime identity, registration and route/game path, configuration/scheme keys, Redis/game prefixes, build/start/package scripts, Docker or artifact names, and `.github/workflows/**` inputs or outputs. Keep `metadataGameId` separate when it is a proven provider/wire value. Never perform an unreviewed global replacement.
2. Implement the server workstream from `doc/project_plan.md` and `doc/s_init/server/detailed-replication-plan.md` through the normal `s_ser` evidence, contract, implementation, verification, simulator, and reporting Gates.
3. Before any start or restart, apply the full `s_ser` local-runtime coexistence Gate: snapshot existing listeners and owners, allocate isolated REST/gRPC/Redis/MySQL resources, refuse collisions, bind locally, and recheck every pre-existing service afterward.
4. Save the identity inventory, tests, deterministic request/seed, raw response and hash, simulator result, port/storage allocation, and before/after coexistence evidence below `<project>/doc/s_init/server/`.

Do not complete the server goal merely because code builds or HTTP returns 200. Completion requires the execution contract's server handoff, all plan-blocking server acceptance, `SIMULATOR_PASS`, and `LOCAL_RUNTIME_PASS`. Preserve allowed non-blocking math sign-off as an explicit Gate. If verification fails, remain inside the server goal and return to `s_ser` evidence/contract work; never create the client goal to bypass it.

### 12. Complete client identity and Reel work

Only after the server goal is complete, create a new client goal and dispatch `s_cli` explicitly in `s_init execution` mode. Run two ordered client slices:

1. Migrate target-client identity to `replicationId`. Audit and update owned Scene names/references, Cocos project/settings identifiers such as `slot_{replicationId}`, `GameConfig` and runtime `gameConfig`, request game code where the accepted server contract requires it, package/build configuration, and `.github/workflows/**` artifact/deployment inputs. Preserve `.meta` UUID relationships and serialized references through Cocos-aware operations. Classify every remaining donor identifier; do not rewrite provider IDs, URLs, UUIDs, third-party package names, or historical evidence without proof.
2. Implement the Reel/Spin/SlotReel portion of `project_plan.md` and `doc/s_init/client/detailed-replication-plan.md` through the formal `s_cli` `ROOT_CAUSE -> PLAN -> EXECUTE -> ACCEPT -> REPORT` loop. The five Reel modules, Reel core, Reel background, Drop peeking, Spin peeking, and Elimination, are separate implementation and acceptance entries; the GPT-6 thinking route must resolve each entry's VFX/effect, animation/timing, audio, callback, cleanup, evidence, and `{replicationId}_res` Prefab replacement decision before execution. Prefer a suitable target-local Prefab to replace the old Prefab, otherwise record the compatibility reason and preserve serialized bindings and `.meta` UUIDs. First copy or recapture the accepted server fixture into the target client's `doc/s_cli/**` evidence area and pass `serverDataCheck`; a runner path alone is not valid client evidence. `s_cli` must not start, stop, or modify the server.

Complete the client goal only after identity residue checks, version 2 plan validation, static tests, relevant Cocos/MCP runtime checks, Reel behavior acceptance, and the required cross-end fixture replay pass. Report build, visual, deployment, and math evidence as separate outcomes.

### 13. Report

Report the inventory, project-info action, JavaScript Gate, runner and baseline state, roadmap status, required screenshot scenario coverage, both detailed-plan paths/states/hashes, both goal states, identity migrations, server handoff, runtime coexistence, client Reel acceptance, evidence limits, and exact recovery point for every remaining Gate.

## Stop states

- `NEEDS_PROJECT_INFO_INPUT`
- `INVALID_PROJECT_INFO`
- `NEEDS_JS_SCRIPTS`
- `NEEDS_PROJECT_PLAN_REVIEW`
- `NEEDS_RUNTIME_EVIDENCE`
- `NEEDS_CHROME_MCP_RELOAD`
- `NEEDS_CHROME_MUTE`
- `CHROME_CLEANUP_FAILED`
- `NEEDS_TARGETED_COMPETITOR_SAMPLE`
- `NEEDS_CLIENT_DETAILED_PLAN`
- `NEEDS_SERVER_DETAILED_PLAN`
- `NEEDS_DETAILED_PLAN_REVIEW`
- `NEEDS_DETAILED_PLAN_REFRESH`
- `NEEDS_LOCAL_REFERENCE`
- `NEEDS_SERVER_ROOT`
- `GIT_NOT_AVAILABLE`
- `INVALID_REPOSITORY_TOPOLOGY`
- `SERVER_PATH_COLLISION`
- `SERVER_REPO_TOPLEVEL_MISMATCH`
- `SERVER_REPO_ORIGIN_MISMATCH`
- `SERVER_CLONE_FAILED`
- `SERVER_CLONE_PARTIAL`
- `NEEDS_SERVER_BASE_CODE`
- `GOAL_CONFLICT`
- `GOAL_TOOL_UNAVAILABLE`
- `SERVER_IDENTITY_INCOMPLETE`
- `SERVER_GOAL_BLOCKED`
- `SERVER_HANDOFF_INCOMPLETE`
- `NEEDS_ISOLATED_RUNTIME`
- `NEEDS_SERVER_RECOVERY`
- `IDENTITY_MAPPING_CONFLICT`
- `NEEDS_PROTOCOL_EVIDENCE`
- `NEEDS_ACTIVE_BUILD_PROFILE`
- `SERIALIZED_IDENTITY_UNRESOLVED`
- `CLIENT_IDENTITY_INCOMPLETE`
- `CLIENT_GOAL_BLOCKED`
- `DIRTY_FILE_CONFLICT`
- `OUT_OF_INIT_SCOPE`
