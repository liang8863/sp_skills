# Project Plan Contract

Create exactly one `<project>/doc/project_plan.md`. It is an evidence-gated client/server roadmap, not executable code instructions and not a frozen protocol contract.

Use the following section order. Preserve `UNKNOWN` rather than guessing, and cite evidence IDs for every game-specific statement. Only visible Markdown outside fenced code blocks, HTML comments, and raw `<script>`, `<template>`, `<pre>`, or `<style>` blocks is contract content; examples hidden in any of those forms do not satisfy headings, metadata, prose, or tables.

## 1. Identity and status

Record:

- `schemaVersion: 1`
- `replicationId: {replicationId}` from the project slug; this also selects `{replicationId}_res` and `slot-be-runner-{replicationId}`
- `metadataGameId: {value}` for the provider/wire value from `project_info.md`; preserve it separately even when it differs
- `targetClient: {canonical client path}` and `targetServer: {canonical runner path}`; both must exactly match the paths derived by `inspect-init-state.ps1`
- `projectInfo: doc/project_info.md`
- `scriptsRoot: doc/js_scripts`
- `resourceRoot: assets/resources/{replicationId}_res`
- `competitorUrl: {redacted origin/path}`, exactly equal to the inventory `redactedCompetitorUrl`; it must never be `UNKNOWN` and must not contain userinfo, a query, or a fragment
- `serverState: EXISTING`, `EXISTING_DIRTY`, `CLONED`, `UNKNOWN`, or a server Gate
- `planState: DRAFT_EVIDENCE_GATED`, `READY_FOR_HANDOFF`, or `BLOCKED`
- `generatedAt`, `clientGitBaseline`, and `serverGitBaseline`; `UNKNOWN` is valid while the plan remains evidence-gated

The ordered sections, required Identity metadata, table headers, separators, and at least one data row per required table are machine-checked by `inspect-init-state.ps1`. Every table data row must have exactly the declared number of columns and every cell must be non-empty. `replicationId` is ordinal and case-sensitive. A target-local resource root is `READY` only when recursive inspection finds at least one ordinary file and no reparse points, and a `READY` root requires at least one valid `local-resource` row in section 3. An existing empty tree is `EMPTY`. A `MISSING` or `EMPTY` resource root requires `planState: DRAFT_EVIDENCE_GATED` or `BLOCKED`, a `NEEDS_LOCAL_REFERENCE` row in section 11, and no `local-resource` row in section 3. Use explicit `UNKNOWN` rows when evidence is incomplete instead of leaving a required table empty.

## 2. Scope and non-goals

Define the intended replication surface and what the plan does not prove in non-`UNKNOWN` prose. State explicitly that this document is neither an `s_cli` version 2 `plan.json` nor an accepted `s_ser` contract.

## 3. Evidence registry

| Evidence ID | Class | Relative source/artifact | Observation | Supports | Confidence | Limits |
| --- | --- | --- | --- | --- | --- | --- |

Evidence IDs must be non-empty and unique case-insensitively. The registry must include at least one `project-info` row and one `quick-reference` row. When `doc/js_scripts` is `READY`, it must also include at least one valid `legacy-script` row. Allowed competitor behavior classes are `legacy-script`, `local-resource`, and `competitor-runtime`. Use `project-info` and `quick-reference` only as metadata/coverage classes. Current client/server code, raw responses, tests, and README files describe the target baseline or contract, not competitor behavior.

Every evidence source must resolve to an existing ordinary local file at its fixed path. The complete path from the canonical client or repository root through the evidence file must contain no reparse point:

- `legacy-script`: a `.js` file under `doc/js_scripts/**` whose content is not whitespace-only
- `local-resource`: `assets/resources/{replicationId}_res/**`
- `competitor-runtime`: `doc/s_init/evidence/**`
- `project-info`: exactly `doc/project_info.md`
- `quick-reference`: exactly `.codex/agents/s-cli-agent/references/slot-function-reference.md`, relative to the client repository root

Do not record an absolute URL, drive path, UNC path, traversal segment, `CC3Proj`, `UIProj`, sibling `*_UI`, or `resource-project` locator as an evidence source. A URL belongs only in Identity as a redacted locator; runtime evidence must point to the captured local artifact. In sections 4, 5, 6, and 7, every Evidence IDs cell must contain either exact `UNKNOWN` or one or more registered IDs separated by commas or semicolons. Do not mix `UNKNOWN` with IDs. A non-`UNKNOWN` competitor behavior claim in sections 4, 5, or 6 must cite at least one `legacy-script`, `local-resource`, or `competitor-runtime` ID; `project-info` and `quick-reference` cannot support such a claim by themselves.

For runtime evidence include date, viewport, action sequence, capture/log path, and reproducibility limit. Never put a signed competitor URL in this table.

## 4. Capability matrix

Include at least one row for each of these 18 exact canonical module labels, even when its state is `UNKNOWN`:

- Bootstrap / Loading
- Bridge / host communication
- Control / spin modes
- GameService lifecycle
- API / mapper / response contract
- Event / state lifecycle
- Reel core / stop / mask / layout
- Reel background
- Drop peeking
- Spin peeking
- Reel elimination
- Performance orchestration
- InfoBoard / status
- Win / payout presentation
- Big Win / Total Win
- Free Game / Bonus
- game-specific mechanics
- Resource / Prefab / audio / animation

| Module | Capability | Observed behavior or UNKNOWN | Evidence IDs | Client gap | Server gap | Route (`s_cli`/`s_ser`/both/blocked) |
| --- | --- | --- | --- | --- | --- | --- |

An `N/A` claim also requires evidence.

Additional rows are allowed only for named game-specific modules using `game-specific: {mechanic}` (or an equivalent `game-specific mechanics:`, `/`, or `-` prefix). They do not replace the canonical `game-specific mechanics` row.

Every Route cell must be exactly `s_cli`, `s_ser`, `both`, or `blocked`.

## 5. Source-to-target mapping

| Map ID | Capability | Source behavior | Evidence IDs | Target client owner/candidate path | Target server producer/contract | Adaptation | Dependency/Gate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

List candidate client areas only. Exact `affectedFiles` are determined later by the formal `s_cli` root-cause pass.

## 6. Protocol and fixtures

| Flow/semantic field | Request/response shape, unit, null/omitted semantics | Client consumer and lifetime | Server producer | Evidence IDs | Raw/fixture artifact | Status |
| --- | --- | --- | --- | --- | --- | --- |

Use semantic placeholders for unknown wire names. Do not infer a field name merely because another game or a generic engine uses it.

| Fixture ID | Scenario | Seed and provenance | Request | Expected frames/layout/state/amount | Raw response path | Runner test | Simulator/client replay | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 7. Client workstream

| Task ID | Scope | Prerequisites | Candidate target areas | Evidence IDs | Verification | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

For a cross-end replication, include distinct ordered tasks for client identity migration and Reel/Spin/SlotReel implementation. The identity task must cover active Scene/project identity, `slot_{replicationId}`, runtime configuration precedence, package/build configuration, and GitHub workflow ownership. The Reel task depends on both the completed server handoff and completed client identity task.

Every client goal plan must also include this Reel module choreography matrix. It has exactly one row for each exact module label: `Reel core`, `Reel background`, `Drop peeking`, `Spin peeking`, and `Elimination`. Use the GPT-6 thinking route to prepare this matrix, selecting `gpt-6-astra` when a concrete model identifier is required. A module that has not been proven still needs an `UNKNOWN` row and its Gate; an `N/A` row requires local evidence. For each module, trace the source-to-target relationship between its VFX/effect, animation/timing, audio, completion callback, and cleanup. The result must preserve the evidenced choreography for that module rather than mixing unrelated resource, animation, or audio references. The resource Prefab replacement decision must prefer an existing target-local Prefab below `assets/resources/{replicationId}_res/` over a legacy Prefab. If replacement is unsafe or no suitable target-local Prefab exists, record `RETAIN_LEGACY: <evidence-based reason>` or `NO_RESOURCE_PREFAB: <evidence-based reason>`; do not silently keep a donor Prefab. After a target resource Prefab replaces an old Prefab, its serialized position, rotation, scale, anchor, size, opacity, active state, and component defaults are the baseline. Do not copy any old Prefab property into the replacement merely to preserve the prior layout. Record `KEEP_RESOURCE_SERIALIZED: <local evidence>` when that baseline remains, or `ADJUST_FOR_COMPETITOR: <property>=<value>; <target-local resource, archived JS, or runtime evidence>` when replication evidence proves an adjustment. Replacements must preserve the active Scene/Prefab serialized bindings and `.meta` UUID relationships through Cocos-aware import/binding work. Exact target files remain the responsibility of the formal `s_cli` plan.

| Module | State / trigger / data boundary | Candidate target owner / binding | Resource Prefab replacement decision | New Prefab property / transform decision | VFX / effect | Animation / timing | Audio | Completion callback / cleanup | Evidence IDs | Fixture / acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 8. Server workstream

| Task ID | Scope (contract/rules/seeds/math/runtime) | Prerequisites | Candidate server area | Fixture output | Tests/simulator | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

For a cross-end replication, include distinct ordered coverage for server identity/package migration, gameplay contract/rules/fixtures, and isolated runtime/simulator acceptance. Identity migration is first and includes registration, game path, configuration/scheme/storage identity, build/start/package scripts, artifacts, and GitHub workflows.

## 9. Dependency sequence

Show phase order and cross-end dependencies in non-`UNKNOWN` prose. The required cross-end order is server identity/package -> server contract/rules/fixtures -> isolated server simulator/coexistence acceptance -> client identity/config/package -> client Reel implementation -> client runtime/cross-end acceptance. The complete server Goal and accepted deterministic raw fixture are mandatory before the client Goal is created; cross-end implementation must not run in parallel.

## 10. Acceptance matrix

| Acceptance ID | Layer | Scenario/fixture | Expected observable | Method/artifact | Status |
| --- | --- | --- | --- | --- | --- |

Keep static, contract, runner, simulator, Cocos runtime, visual, cross-end E2E, and math acceptance separate. HTTP 200, build success, AssetDB import, or zero missing references are smoke evidence only.

## 11. Unknowns and Gates

| Gate | Missing or contradictory evidence | Blocks | Allowed work | Exit criteria | Owner |
| --- | --- | --- | --- | --- | --- |

Use established states where applicable: `NEEDS_LOCAL_REFERENCE`, `NEEDS_RUNTIME_EVIDENCE`, `NEEDS_PROTOCOL_EVIDENCE`, `CLIENT_CONTRACT_GAP`, `NEEDS_MATH_SIGNOFF`, `NEEDS_SIMULATOR`, `SERVER_CLONE_FAILED`.

If the Evidence Registry has no `competitor-runtime` row, this section must include `NEEDS_RUNTIME_EVIDENCE`; `DRAFT_EVIDENCE_GATED` may remain valid with that Gate and explicit `UNKNOWN` behavior. `READY_FOR_HANDOFF` cannot contain a Gate whose name starts with `NEEDS_`.

## 12. Task handoff

| Order | Task ID | Skill | Code repo/write scope | Document root | Evidence/fixtures | Depends on | Ready when | Deliverable | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Skill must be exactly `s_cli` or `s_ser`. Document root must be the safe project-relative path `doc` or a descendant such as `doc/s_init`; absolute, URL, traversal, runner, external, and sibling-project document roots are invalid.

Every document produced during initialization and all planning contributions stays under the target client `doc/`; neither planning contributor writes its own task document. After this roadmap is generated and validated, `s_init` must run the targeted competitor-sampling and separate client/server detailed-planning stage defined by `references/detailed-plan-contract.md`. Formal implementation remains outside the `s_init` Agent's direct write scope, but `s_init` may coordinate it through the sequential goals in `references/execution-contract.md`. Each delegated skill must pass its own write-scope Gate before it starts. Do not claim either implementation handoff is executable until those Gates and both detailed-plan Gates pass. For `READY_FOR_HANDOFF`, `doc/js_scripts` must be `READY`, `clientGitBaseline` and `serverGitBaseline` must be concrete, and Client workstream, Server workstream, and Task handoff statuses must not contain `UNKNOWN`, `DRAFT`, or `BLOCKED`.

For cross-end execution, Task handoff rows must preserve this Skill order: all server identity/implementation/runtime rows use `s_ser` and precede every `s_cli` row; the client identity row precedes the client Reel row. The client Reel handoff includes the five-row Reel module choreography matrix and its module acceptance records. The coordination Document root remains below the target client `doc/` for both skills. `READY_FOR_HANDOFF` authorizes only targeted sampling and generation of `doc/s_init/client/detailed-replication-plan.md` plus `doc/s_init/server/detailed-replication-plan.md`; it does not authorize the first `s_ser` implementation handoff. That handoff requires both detailed plans to be current and `READY_FOR_EXECUTION`.

## 13. Definition of done

Define observable completion for the roadmap itself in non-`UNKNOWN` prose and keep detailed planning, implementation, runtime, visual, deployment, and mathematical sign-off as separate outcomes. When the roadmap is intended for `s_init` execution, cite `references/detailed-plan-contract.md` and `references/execution-contract.md`; state that roadmap readiness requires subsequent competitor sampling and two separate detailed plans and is not either implementation Goal's completion.
