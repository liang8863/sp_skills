---
name: s-ser
description: Implement, document, accept, and, when explicitly requested, ship Slot server-runner work from evidence through deterministic simulator-ready verification. Use when a request starts with @s_ser, @s-ser, or $s-ser, or requires a Slot game's server rules, response contract, seeds, math checks, server-toolchain ownership, debug HTTP validation, server README updates, dev/stg runner builds or deployments, or diagnosis of a runner push/build/deploy that did not reach its environment.
---

# s-ser

Follow `<slot-fe-client-root>/.codex/agents/s-ser-agent/AGENT.md`.

## Browser access

When the workflow needs to open, inspect, or interact with a web page, use the
`chrome_devtools` MCP exclusively. This includes simulator visual checks and an environment
game-route check. Do not invoke the `browser` or `browser:control-in-app-browser` skill, or
substitute another browser-control wrapper. This does not replace direct HTTP validation,
server tests, or the slot simulator's non-browser checks. If `chrome_devtools` is unavailable,
preserve the non-browser evidence and report `NEEDS_CHROME_DEVTOOLS` for the blocked browser
evidence rather than changing tools.

For every permitted Chrome MCP run, call `list_pages` before opening the target and record the
baseline page IDs. Create a task-owned page, preferably in a task-specific isolated context;
do not repurpose or later close an unrelated baseline page. Before loading any target that may
play audio, mute the dedicated Chrome MCP browser instance through a supported instance-level
launch/configuration or MCP mechanism and verify it. HTML media-element muting alone is not
sufficient because the game or simulator may use WebAudio. If mute cannot be applied or
verified, return `NEEDS_CHROME_MUTE` before navigation or interaction.

Track every page and popup created by the task. In a cleanup-safe `finally` path for success,
failure, timeout, and blocked exits, stop any active trace and save required evidence, close
all task-owned pages in reverse creation order with `close_page`, then close a dedicated
task-owned Chrome instance when an ownership-specific shutdown is available. Verify cleanup
with `list_pages`. Never close baseline pages or terminate Chrome by broad process name. If the
last task-owned page or instance cannot be closed, return `CHROME_CLEANUP_FAILED` with its
identity and do not claim browser acceptance or cleanup success.

## s-init planning contribution

Only when `s_init` explicitly dispatches `s_ser` for the client-owned `doc/project_plan.md`, replace the normal server workflow with read-only planning analysis. Use the target client's `doc/project_info.md`, `doc/js_scripts`, redacted competitor-runtime evidence saved by `s_init`, current client consumers, and the matching `slot-be-runner-{replicationId}` code; keep a differing provider/wire `gameId` explicit. Inspect `assets/resources/{replicationId}_res` when it contains ordinary files. When it is missing or empty, return the JS/runtime/server-based partial contribution and add `NEEDS_LOCAL_REFERENCE`; do not stop the `s_init` draft. Return the runner baseline, candidate producers/contracts, deterministic fixture needs, tests, simulator work, sequencing, and evidence Gates to `s_init`. Do not require or inspect an external resource project, freeze unverified fields, implement code, start services, or write runner/client documents. Mark unsupported contract details `UNKNOWN` or `NEEDS_PROTOCOL_EVIDENCE`. All normal `s_ser` invocations continue with the rules below, including their normal runner-documentation and resource-protocol Gates.

## s-init detailed planning contribution

Only when `s_init` explicitly dispatches `s_ser` after generating and validating `doc/project_plan.md`, replace the normal server workflow with a read-only server detailed-planning contribution. Require the roadmap hash plus the targeted screenshot evidence and any available sanitized Network/request/raw-response evidence, then read `s-init/references/detailed-plan-contract.md`. Map every in-scope server roadmap task and acceptance ID to observed flows, consumer-to-producer semantics, identity and contract work, rules/state, deterministic fixtures and seed provenance, persistence/queue, math, tests, simulator, packaging, isolated runtime/coexistence acceptance, and Gates. Return content for `doc/s_init/server/detailed-replication-plan.md` to `s_init`; do not browse the competitor URL, freeze unknown fields, write the document, implement code, or start services. Apply the `s_init` scenario-screenshot coverage rule rather than any fixed spin/event count. A missing required screenshot returns a `DRAFT_EVIDENCE_GATED` contribution with the `CAPTURED`/`MISSING` matrix and `NEEDS_TARGETED_COMPETITOR_SAMPLE`; missing Network evidence instead leaves only the affected protocol semantics `UNKNOWN` or gated.

## s-init execution mode

Only an explicit `s_init execution` dispatch inside the active server goal enables this mode. Read the target client's `doc/project_plan.md`, `doc/s_init/server/detailed-replication-plan.md`, and `s-init/references/execution-contract.md`; require roadmap `planState: READY_FOR_HANDOFF`, server `detailedPlanState: READY_FOR_EXECUTION`, matching hashes/current baselines, and `inspect-server-baseline.ps1` status `READY`. This mode uses only the target client's `doc/js_scripts`, `assets/resources/{replicationId}_res`, saved competitor-runtime evidence, current client consumers, and target runner as replication evidence. It must not inspect an external resource project or sibling game.

Run the full server implementation workflow, with these overrides and added Gates:

1. Before game-rule changes, build a donor-to-target identity inventory and migrate owned registration, game code/path, runtime configuration/scheme, storage prefixes, build/start/package scripts, artifact/image names, and `.github/workflows/**` to `replicationId`. Keep a differing `metadataGameId` only at a provider/wire boundary proven by evidence. Do not perform a blind global replacement or rename SDK/third-party identities.
2. Keep server and required simulator source writes inside their normal owning repositories. Route every new task document, fixture copy, command result, runtime log, screenshot, and handoff artifact to the target client below `doc/s_init/server/`. In this mode do not create or update runner `README.md` or runner `doc/**`; client-owned coordination documents replace the normal DOCUMENT output location.
3. Apply every normal EVIDENCE, CONTRACT, IMPLEMENT, VERIFY, simulator, and local-runtime coexistence requirement. A build, open listener, or HTTP 200 is not completion.
4. Return an accepted deterministic request/seed/raw response with SHA-256, response-contract summary, tests, simulator evidence, target port/storage/PID ownership, before/after probes for pre-existing services, identity residue classification, and remaining Gates to `s_init`.

Do not report the server goal complete until identity migration, all plan-blocking server acceptance, `SIMULATOR_PASS`, and `LOCAL_RUNTIME_PASS` pass. On failure stay inside the active server goal. Do not edit the target client, create the client goal, or relax a Gate to unblock it.

Resolve the canonical server root as `<slot-fe-client-root>/games/Server`. The target runner is `<server-root>/slot-be-runner-{replicationId}` and the simulator is `<server-root>/slot-simulator-game-ways`; do not infer either repository from the caller's current directory.

## Mandatory server-toolchain orientation

Before server planning, contract freezing, implementation, simulator work, or any `s_init`
server contribution, read `references/server-toolchain-quick-reference.md`. Use it to identify
the owning repository for each requested behavior and record a compact task-specific selection:

- target runner and its Git origin;
- shared repositories that must be inspected and why;
- the runner's effective `go.mod` versions plus active `replace` or `go.work` mappings;
- repositories that may be modified under the current request versus read-only references.

The quick reference is an ownership and navigation aid, not evidence for a target game's rules,
wire fields, probability values, or current deployed version. Verify the selected repository's
current origin, source, README, manifest, and Git state locally before relying on it. A sibling
checkout does not affect a runner merely because it exists beside it: follow the runner's module
version unless an active `replace` or `go.work` proves local binding.

Default server feature ownership remains the target `slot-be-runner-{game}`. Inspect
`slot-be-engine-sdk` for shared game lifecycle/RTP/queue behavior, `slot-be-games-ways` for the
service/API host, `slot-be-games-management` for catalog/status behavior, `slot-rtp-scheme` for
scheme references, and `slot-simulator-game-ways` for client-facing contract verification. Do
not copy a shared implementation into a runner to avoid fixing the correct owner. Conversely,
do not modify a shared repository for a game-specific exception. Existing write authorization
for the target runner and required simulator does not implicitly authorize changes to the SDK,
service host, management service, or scheme repository; keep them read-only unless the user
explicitly places that repository in scope. The controlled `slot-rtp-scheme` fast-forward in the
scheme discovery Gate remains the only standing exception.

## Scheme discovery and conditional structure gate

Before freezing a server contract, implementing or accepting runner changes, or performing a dev/stg delivery, discover the target game's scheme evidence. A runner-local `scheme.json` is not a prerequisite for running the `s-ser` workflow.

1. Derive `GAME_CODE` from the target runner's proven registration/identity, not from an unrelated provider metadata value. Never substitute another game's file.
2. Before looking up the reference, require `slot-rtp-scheme` to be its own clean Git worktree on an attached branch whose upstream is on `origin`. Synchronize that upstream as `git fetch --prune origin` followed only by a fast-forward update. A dirty worktree, detached HEAD, missing/non-`origin` upstream, local-ahead or diverged history, fetch failure, fast-forward failure, or post-sync dirtiness returns `NEEDS_SCHEME_SYNC_DECISION`; stop scheme-dependent work and continue the rest of the task. Do not stash, switch branches, rebase, reset, merge with a commit, or resolve this repository automatically.
3. Treat that controlled fast-forward pull as the only allowed mutation of `slot-rtp-scheme`. Never create, edit, format, rename, delete, copy into, stage, commit, or push anything there. Record the remote URL, branch/upstream, before/after commit, ahead/behind counts, post-sync dirty state, selected reference path and SHA-256, and the local `scheme.json` path/SHA-256 when it exists.
4. After the pull, resolve exactly one ordinary file named `{GAME_CODE}_*_试玩版.json` under `<server-root>/slot-rtp-scheme/试玩版json/`. Never create a reference or select another game's document. Return `NEEDS_SCHEME_REFERENCE_DECISION` when no match exists and `NEEDS_SCHEME_REFERENCE` when the match is ambiguous or unreadable, but do not stop scheme-independent CONTRACT, implementation, acceptance, or delivery solely for either status.
5. When the runner has `scheme.json`, parse both files and compare their recursive structure: property names, nesting, object/array containers, array lengths and per-index element structure, and scalar JSON kinds must match. Property order and scalar values may differ. Structural equality does not validate weights, RTP, game math, or semantic correctness; those still require the normal evidence and math Gates.
6. When the runner has no `scheme.json`, automatically use the uniquely matched, valid trial-version JSON as the available scheme source. Return `VALID` with `validationMode: REFERENCE_FALLBACK`, `runnerSchemePresent: false`, and `structureCompared: false`; do not create or copy a runner-local file. The missing local file is not a task Gate.
7. Run `powershell -NoProfile -ExecutionPolicy Bypass -File "<slot-fe-client-root>/.codex/skills/s-ser/scripts/validate-scheme-structure.ps1" -RunnerPath "<runner>" [-GameCode "<GAME_CODE>"]` and save its JSON result in the normal evidence root. A `demo.json`, workflow file, successful build, or successful startup does not replace scheme discovery when the current work depends on scheme data.
8. Return `NEEDS_RUNNER` when the runner path itself is absent and `SCHEME_STRUCTURE_MISMATCH` when a present local `scheme.json` is invalid or differs structurally from its reference. Scheme discovery/sync/reference failures block only work whose correctness depends on the scheme; preserve the status and continue all scheme-independent workflow stages. The controlled reference pull remains the sole exception to `s_init planning contribution` read-only behavior. In `s_init execution`, carry any unresolved scheme status only against scheme-dependent acceptance IDs rather than blocking the whole server Goal.

1. Start from the target runner README, game specification, Git state, and the shared function index at `<slot-fe-client-root>/.codex/agents/s-cli-agent/references/slot-function-reference.md`.
2. Outside the three explicit `s_init` modes, before writing a replication plan or freezing a response contract, locate and read the corresponding resource project. Prefer the target client's `doc/project_info.md`; otherwise resolve the sibling `CC3Proj/<game>_UI/doc/project_info.md`. Read the resource project's project/competitor metadata and relevant `doc/` reports, then trace the actual client scripts, Prefab/Scene bindings, and call sites that consume game results.
3. Reverse-engineer the client/server protocol from that resource-engine evidence: build a `client consumer -> response/request field -> server producer -> lifetime -> deterministic assertion` matrix. Use `assets/scripts` (`GameService`, API/types/mapper, Performance, Reel, Free Game, multiplier and payout modules) and serialized Prefab/Scene properties to establish field names, frame order, layout shape, and state transitions. The shared function index is only a boundary map, never a source of game rules or field meanings.
4. Treat `doc/project_info.md` competitor URLs and other resource reports as evidence locators. A URL entry or static resource name does not prove a runtime response, payout, timing, or protocol field; keep those items `inferred` or `unknown` until runtime/provider evidence confirms them. Redact signed query parameters in new documents.
5. Keep the mandatory loop: `EVIDENCE -> CONTRACT -> IMPLEMENT -> VERIFY -> DOCUMENT -> REPORT`; the resource-project protocol pass is a required part of `EVIDENCE` before `CONTRACT`.
6. For normal standalone `s_ser` work, preserve deterministic seeds and simulator instructions under the target runner's `doc/` directory whenever a feature can be represented by a reproducible response. The explicit `s_init execution` mode uses its client-owned document root instead.
7. For every server implementation change, use `<slot-fe-client-root>/games/Server/slot-simulator-game-ways` as a client-facing verification surface. If the game has no simulator view, add a minimal route/view before claiming client verification; do not substitute a sibling game's page without recording the contract mismatch.
8. Browser validation is optional rather than an acceptance prerequisite. Prefer server tests, direct HTTP checks, and the slot simulator; when a browser run is needed, use `chrome_devtools` MCP under the Browser access policy and time-box it.

## Mandatory local-runtime coexistence gate

Whenever an `@s_ser` task starts, restarts, or validates a local runner, it must coexist with every currently running server instance:

1. Before changing state, snapshot the active REST, gRPC, Redis, and MySQL listeners plus their owning process command lines. Record the existing runner health endpoints that can be checked without mutation.
2. Select target-specific REST/gRPC ports and an isolated runtime configuration that do not overlap the snapshot. Use a dedicated Redis process/datadir and a dedicated MySQL schema/datadir by default. A shared Redis process or database is allowed only when the user explicitly requests it and startup/debug cleanup is proven to be scoped to the target game.
3. Preflight every selected port immediately before startup. If a port belongs to an unrelated process, return `NEEDS_ISOLATED_RUNTIME`; never kill, restart, reconfigure, or replace the occupying process to make room.
4. Reuse a running dependency or runner only when its listener owner, executable path, command line, config path, and target game identity all match. Otherwise treat the port as occupied by another instance.
5. Bind local-only services to loopback unless remote access is explicitly required. Start the target runner from its repository root so relative scheme/config paths resolve to that runner, and keep its binary, logs, PID files, Redis files, and MySQL files under target-owned paths.
6. After startup, verify listener ownership, target health, target game route, and at least one non-mutating game-specific endpoint such as bets. Recheck every pre-existing health endpoint and confirm its listener remains owned by the expected process.
7. Save the allocation, before/after process evidence, commands, target probes, existing-instance probes, and any independent restart observed during the window under the normal task's evidence root: the target runner's `doc/`, or the client-owned `doc/s_init/server/` override in `s_init execution` mode. A target HTTP 200 without the coexistence recheck is not `LOCAL_RUNTIME_PASS`.
8. Make checked-in startup automation idempotent: a second invocation may reuse only verified target-owned processes and must not create duplicate listeners. Keep deployment configuration unchanged unless deployment changes are explicitly in scope.

## Optional dev/stg build and deployment handoff

Run this section only when the user explicitly asks to deploy a runner to `dev` or `stg`,
or to diagnose why that delivery did not happen. It is a delivery gate after the normal
implementation and verification work; it does not waive the evidence, contract, tests,
simulator, or local-runtime coexistence Gates. Do not commit, push, dispatch a workflow,
or alter deployment configuration unless the user has authorized that action.

1. Confirm the target repository identity before any remote operation. Check `origin`, the
   default/source branch, the requested environment branch, the current commit, and remote
   refs. The expected naming convention is `slot-be-runner-<game-code>`, but the configured
   remote is authoritative.
2. Read the target repository's build workflow and any called workflows before diagnosing a
   missing deployment. Record its `push.branches`, `push.paths`, `workflow_dispatch`, image
   tag, and CD handoff behavior. Do not assume every runner uses the same filename, path
   filters, or a particular deployment platform.
3. Treat `paths` filtering as a common explanation for a missing build. Typical relevant
   files are Go sources, `go.mod`, `go.sum`, game scheme/demo data, and the runtime Dockerfile,
   but use the workflow's actual filters. A documentation-only change may correctly produce no
   build; never create a meaningless source change merely to trigger CI. Use an authorized
   manual dispatch when the workflow provides one.
4. For an established environment branch, push the reviewed target commit to the requested
   environment branch only. Typical commands, after confirming the branch names, are:

   ```text
   git push origin dev
   git push origin stg
   ```

   Do not push both environments unless both were requested. Do not infer that `master` or
   `main` is the source branch; inspect the repository first.
5. For a first delivery, verify that the intended source, `dev`, and/or `stg` refs exist on
   the remote with `git ls-remote`. Create a missing environment branch from the reviewed
   source commit only when authorized. If the branch-creation push did not create a build run,
   inspect the workflow's event/filter rules and use its `workflow_dispatch` entry point when
   available; do not encode a blanket assumption that every first branch push is ignored.
6. A successful build is not deployment acceptance. Capture the build run URL/identifier,
   image/tag, CD or deployment run, and the target environment's game-specific probe. When the
   application can be opened safely, also verify the game route with a deterministic request
   or a smoke spin appropriate to that environment. Record this evidence under the task's
   normal evidence root.
7. Diagnose delivery failures in this order:
   - Confirm the expected commit and ref reached the remote.
   - Confirm a matching build run was created and that its trigger/filter matched the change.
   - Inspect the build logs and repair a reproducible repository failure before rerunning.
   - If build succeeded but CD/deployment failed or never started, capture the image/tag and
     deployment evidence, then report the platform-side dependency instead of repeatedly
     dispatching builds.
8. Scope this workflow to `dev` and `stg`. Treat sandbox, release, and production as separate
   release processes requiring explicit instructions. Deployment/overlay repositories are
   platform-owned: inspect and report their state when authorized, but do not modify them
   merely to make a runner deploy.

Use `DEPLOY_NOT_TRIGGERED`, `BUILD_FAILED`, `DEPLOY_FAILED`, or
`DEPLOYMENT_ACCESS_REQUIRED` in the report when applicable. State the exact missing workflow,
authorization, environment probe, or platform action rather than claiming a deployment passed.

## Runner README format

For a runner README creation or reformatting task, first read
`references/sjzbg-runner-readme-style.md`. It is the canonical structural reference for
the compact runner-contract layout: requirement documents, core mechanisms, Free Game,
symbol table, layout structure, detail fields, SDK overrides, and repair notes.

Keep the heading hierarchy and documentation depth, but replace every SJZBG-specific rule,
path, port, symbol, seed, response field, and acceptance status with verified facts from the
target runner. Never copy the reference game's semantics merely to fill a missing contract;
label the missing target evidence instead.

### README output reference

The completed target README should be a runnable-contract document, not a changelog. Follow
the reference's concise section sequence and produce these target-specific outputs:

1. A game identity/scope statement, then `需求文档` linking only the target game's authoritative
   specification and runner evidence.
2. `核心机制` with focused subsections for the board/index projection, each nonstandard symbol
   or drop lifetime, and multiplier/payout timing; add `Free Game` when the game supports it.
3. `符号表` and `Layout 結構` tables that state exact IDs, payout boundaries, dimensions,
   coordinate/index translation, compact/padded projections, or fixed/converted cells as the
   target needs.
4. `Detail 欄位` describing every target-specific response member, then `SDK 重寫函數` as a
   table of the overridden hook, SDK default, and target-specific difference.
5. `修復說明` as a numbered target-specific change and acceptance summary. Put links here to
   seed fixtures, simulator evidence, isolated runtime notes, protocol matrices, commands, and
   remaining gates. Preserve `confirmed`, `inferred`, `unknown`, `NEEDS_PROTOCOL_EVIDENCE`,
   `CLIENT_CONTRACT_GAP`, and `NEEDS_MATH_SIGNOFF` instead of inventing certainty.
6. Before reporting, verify the heading sequence, all relative README links, current coordinate
   and symbol values, and `git diff --check`. State explicitly when the update is documentation
   only and therefore did not require a server restart or a new gameplay test run.

## Mandatory simulator verification gate

The server task is not verified until the slot simulator has consumed the actual target-game
HTTP response. For BSRQQ, the target route is `/bsrqq` and the request game code is `BSRQQ`.
The simulator step is a client-contract check, not a replacement for unit tests or
mathematical sign-off.

1. Start the server through the mandatory local-runtime coexistence gate and record the exact
   REST URL, port, Redis process/DB, MySQL instance/database, game code, bet, seed, and auth
   mode. Never point the simulator at another game's runtime.
2. Add or update `slot-simulator-game-ways/src/views/<game-id>/` and its router/nav entry
   when the target game is missing. The page must send the target `game_code` (for this task,
   `BSRQQ`), expose seed and bet controls, render all returned frames, and show the raw
   contract fields consumed by the target resource project. For BSRQQ these are
   `rl/orl/wp/wpl/rns/gm/fs/ssaw/tw/twbm/imw/sc/st/nst`. A text/grid renderer is acceptable
   when production art is unavailable, but it must not silently reinterpret layout indexes.
3. Run the simulator in local mode against the isolated server (normally `npm run dev`),
   execute at least one deterministic seed fixture for each changed path, and save the
   request, raw response, rendered URL, console/build result, and screenshot or equivalent
   evidence under the normal task's evidence root, using the client-owned override in `s_init execution` mode.
4. Mark results separately:
   - `SIMULATOR_PASS`: the simulator loaded the target-game route, sent the intended request, and
     rendered every required frame/field without a client exception.
   - `VERIFY_FAILED`: server or simulator command failed; include seed/request and output.
   - `CLIENT_CONTRACT_GAP`: HTTP returned data but the target-game simulator/client mapper cannot
     consume it; do not hide this by converting it to a sibling-game shape.
   - `NEEDS_PROTOCOL_EVIDENCE`: the simulator cannot validate a field because the resource
     consumer exists but the provider/raw response is still unknown.
5. HTTP 200, a successful build, an asset existing, or a non-empty grid alone is smoke
   evidence. Client verification requires the simulator request/response and rendered state
   to be recorded together. If the simulator is unavailable, stop at `NEEDS_SIMULATOR` and
   report the exact missing command/path instead of claiming acceptance.

## Resource-project protocol gate

Outside the explicit `s_init` planning and execution modes, competitor replication must not derive the server contract from a sibling runner, a generic Engine schema, or screenshots alone. The plan must record:

- Resource project path, baseline commit, `doc/project_info.md`, and every resource `doc/` report read.
- Client entry points and call paths for request construction, response mapping, frame iteration, settlement, restore/last-spin, buy entry, and error handling.
- Prefab/Scene fields that constrain protocol data, including serialized array lengths, symbol/display bindings, and feature/multiplier holders.
- A source-to-target adaptation table: resource/client evidence, proposed server field or request member, consumer lifetime, deterministic assertion, and unresolved gap.
- Explicit labels `confirmed`, `inferred`, `unknown`, `NEEDS_PROTOCOL_EVIDENCE`, and `CLIENT_CONTRACT_GAP` whenever the resource logic or runtime evidence is incomplete.

If the resource project cannot be located, its `doc/` cannot be read, or the client consumer path is missing, stop contract freezing and report `NEEDS_RESOURCE_BASELINE` or `NEEDS_PROTOCOL_EVIDENCE` with the exact missing path. Do not fill the gap with copied `jdsry`/sibling values.
