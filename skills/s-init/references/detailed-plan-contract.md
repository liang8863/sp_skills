# Detailed Replication Plan Contract

Generate both detailed plans only after `<project>/doc/project_plan.md` exists and passes the project-plan contract. The full-stack roadmap defines scope and dependencies; it does not replace either side's detailed plan.

## Required artifacts

- Client: `<project>/doc/s_init/client/detailed-replication-plan.md`
- Server: `<project>/doc/s_init/server/detailed-replication-plan.md`

Both files are owned by `s_init`. `s_cli` and `s_ser` provide separate read-only `s_init detailed planning contribution` results; they do not write these files or implementation code in planning mode.

## Ordering and evidence gate

1. Validate the full-stack roadmap and record its SHA-256.
2. Derive separate client and server sampling checklists from the roadmap workstreams and acceptance matrix.
3. Use `competitor-requirement-analysis` against the configured live URL. Save redacted, reproducible artifacts below `doc/s_init/evidence/client/` and `doc/s_init/evidence/server/`. One capture may be registered by both sides when it genuinely supports both, but each detailed plan must state what that evidence proves for its own scope.
4. Complete the client detailed planning contribution and write the client artifact.
5. Complete the server detailed planning contribution and write the server artifact.
6. Validate both artifacts against this contract before opening the execution contract.

For `s_init`, this contract overrides the hard count thresholds in `competitor-requirement-analysis`. There is no minimum total-spin count, status-bar count, multiplier-event count, Spin-attempt count, or per-win-tier occurrence count. Baseline sampling is complete when the following three scenario screenshots exist and are traceable:

| Scenario ID | Required screenshot |
| --- | --- |
| `fg-entry` | Free Game entry transition or entry screen |
| `fg-runtime` | Free Game in-progress runtime state |
| `fg-exit` | Free Game exit or settlement transition |

One representative screenshot per scenario is sufficient. Capture additional screenshots only when they are needed to distinguish materially different states, not to satisfy a quota. The optional scene screenshots are Drop peeking, Spin peeking, Big Win, Mega Win, and Super Mega Win; record them as supplemental evidence only when a roadmap item explicitly needs them. They cannot block either detailed plan or the implementation Goals. Normal Spin screenshots are outside the `s_init` sampling checklist. Each required coverage row must record `CAPTURED` or `MISSING`, the target-local screenshot path, date, viewport, action sequence, mode, and reproducibility limits. A click, URL, asset name, generic engine field, sibling-game artifact, or inference cannot replace a required screenshot.

Sanitized Network/API request and raw-response captures remain useful supplemental server evidence and should be preserved when available, but they are not required to pass this `s_init` screenshot-sampling Gate. Screenshots do not prove field names, wire shapes, payout math, or null/omitted semantics; keep those items `UNKNOWN` or behind `NEEDS_PROTOCOL_EVIDENCE` until separate authoritative evidence exists.

If browser, demo balance, game state, or tooling access prevents any required screenshot, still produce both partial plans with `detailedPlanState: DRAFT_EVIDENCE_GATED`, preserve the scenario coverage matrix and captured artifacts, add `NEEDS_TARGETED_COMPETITOR_SAMPLE`, and stop before the server Goal. Never backfill a missing scene from the roadmap, a sibling game, or the quick-reference checklist.

## Common metadata

Each artifact must record:

- `schemaVersion: 1`
- `side: client` or `side: server`
- `replicationId` and separate `metadataGameId`
- `sourceProjectPlan: doc/project_plan.md`
- exact `projectPlanSha256`
- target repository and Git baseline
- `detailedPlanState: DRAFT_EVIDENCE_GATED`, `READY_FOR_EXECUTION`, or `BLOCKED`
- generation date and sampling date/range
- the three-row required screenshot scenario coverage matrix with status and evidence path
- evidence registry containing only target-local, ordinary files with redacted secrets
- mapped roadmap task IDs and acceptance IDs
- explicit `confirmed`, `inferred`, and `unknown` classifications
- unknowns, Gates, exit criteria, and owner

`READY_FOR_EXECUTION` requires the project-plan hash and Git baseline to remain current, every in-scope roadmap task to be mapped, all three required screenshot scenarios to be `CAPTURED`, and no unresolved Gate that can change implementation behavior, protocol, state sequencing, layout, payout, or acceptance. Any roadmap or relevant baseline change invalidates both detailed plans until they are reviewed and re-hashed.

These Markdown artifacts are planning inputs. The client artifact is not an executable `s_cli` version 2 `plan.json`; the server artifact is not an accepted or frozen wire contract.

## Client detailed plan

The client plan must include:

1. Scope and non-goals mapped to the roadmap's client workstream.
2. The three required scenario screenshots for Free Game entry, in-progress runtime, and exit. Drop peeking, Spin peeking, Big Win, Mega Win, and Super Mega Win are optional scene screenshots and remain outside the baseline screenshot Gate. Normal Spin and other UI states are outside the `s_init` sampling checklist.
3. Evidence-to-owner mapping across Scene, Prefab, serialized bindings, resources, TypeScript controllers, API/mapper consumers, GameService lifecycle, Reel/SlotReel hooks, audio, animation, runtime configuration, build profiles, and workflows.
4. Ordered implementation slices with exact candidate areas, prerequisites, server fixture dependencies, state/timing requirements, cleanup/restore behavior, and write-scope risks. Exact `affectedFiles` remain the responsibility of each formal `s_cli` version 2 plan.
5. Verification and acceptance for static checks, Cocos import/binding integrity, runtime behavior, screenshots, fixture replay, cross-end E2E, build, and deployment as separate outcomes.
6. Client-specific unknowns and evidence needed to close them.
7. A Reel module choreography matrix with exactly one row for `Reel core`, `Reel background`, `Drop peeking`, `Spin peeking`, and `Elimination`. Prepare the matrix with the GPT-6 thinking route, selecting `gpt-6-astra` when a concrete model identifier is required. Each row identifies the state/trigger and data boundary, target owner and serialized/resource binding, resource Prefab replacement decision, new Prefab property/transform decision, VFX/effect, animation/timing, audio, completion callback, cleanup/restore, evidence, fixture, and acceptance. Prefer a suitable target-local Prefab below `assets/resources/{replicationId}_res/` to replace the old Prefab. When it replaces an old Prefab, keep the new Prefab's serialized property and transform values by default; do not copy legacy position, rotation, scale, anchor, size, opacity, active state, or component defaults. Record either `KEEP_RESOURCE_SERIALIZED: <local evidence>` or `ADJUST_FOR_COMPETITOR: <property>=<value>; <target-local resource, archived JS, or runtime evidence>`. A retained legacy Prefab or missing suitable resource must carry its evidence-based reason and preserve Cocos serialized bindings and `.meta` UUID relationships. Preserve the evidenced VFX-animation-audio-callback relationship for each module. Do not infer a module from the quick reference, and keep absent evidence as `UNKNOWN` or behind its Gate.

## Server detailed plan

The server plan must include:

1. Scope and non-goals mapped to the roadmap's server workstream.
2. A server-side interpretation of the required screenshot scenarios, clearly separating visible facts from unknown protocol semantics. Include sanitized launch/game-info/bet/spin/continuation/LastSpin request or raw-response evidence only when available; its absence does not fail the screenshot Gate, but protocol-dependent work remains `UNKNOWN` or gated.
3. Consumer-to-producer contract mapping with field presence, type, units, null/omitted meaning, lifetime, predecessor requirements, and unresolved semantic placeholders.
4. Ordered identity, contract, rules, fixture/seed, persistence/queue, math, build/package, isolated runtime, simulator, and coexistence tasks.
5. A deterministic fixture matrix covering every changed client-facing path, with request, seed provenance when available, expected frames/state/amount, runner test, simulator replay, and client handoff.
6. Verification and acceptance for unit/contract tests, deterministic replay, continuation/queue behavior, simulator consumption, local runtime ownership/coexistence, packaging, deployment, and math sign-off as separate outcomes.
7. Server-specific unknowns and evidence needed to close them.

## Execution handoff

Before creating the server Goal, record the full-stack roadmap hash plus both detailed-plan hashes in `doc/s_init/execution-state.md`. Bind the server Goal to the server detailed plan and the later client Goal to the client detailed plan. If either file is missing, stale, blocked, or not `READY_FOR_EXECUTION`, return the corresponding detailed-plan Gate and do not implement.
