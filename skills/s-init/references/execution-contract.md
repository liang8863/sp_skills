# Sequential Execution Contract

Read this reference only after initialization produced a valid `READY_FOR_HANDOFF` project plan, `inspect-server-baseline.ps1` returned `READY`, and both detailed plans required by `detailed-plan-contract.md` are current and `READY_FOR_EXECUTION`.

## Identity model

- `replicationId` is the target identity derived from `slot-fe-{replicationId}`. It selects the client, runner, local resource root, target game code, route/config identity, and package/artifact identity.
- `metadataGameId` is the provider/wire value recorded in `doc/project_info.md`. It may differ and must not be globally replaced. Use it only at a boundary proven by current raw/provider evidence.
- A donor/template ID is any other game identity inherited by the cloned baseline. Inventory it before editing and classify every remaining occurrence after migration.

Do not use blind repository-wide replacement. Exclude `.git`, generated Cocos directories, build output, dependencies, binaries, captured evidence, and third-party code. Review serialized Cocos JSON, UUIDs, URLs, module import paths, and protocol values according to their actual ownership before changing them.

## Persisted orchestration state

Maintain `<project>/doc/s_init/execution-state.md` with the full-stack roadmap SHA-256, client detailed-plan SHA-256, server detailed-plan SHA-256, canonical client and server paths, client/server Git baselines and dirty-file admission lists, current phase, goal identifier when available, evidence links, blocking Gate, and recovery command or next action.

Allowed phase order is exact:

```text
INITIALIZED
  -> SERVER_GOAL_ACTIVE
  -> SERVER_GOAL_COMPLETE
  -> CLIENT_GOAL_ACTIVE
  -> COMPLETE
```

Never skip, reorder, or run the two implementation goals concurrently. A failed verification stays inside its current goal. Do not mark a goal complete to unlock the next phase.

## Goal lifecycle

1. Inspect the current goal state before creating one. Never replace an unfinished unrelated goal.
2. Create one server objective tied to the target, roadmap hash, server detailed-plan hash, server identity migration, server plan implementation, deterministic simulator verification, and isolated coexistence acceptance.
3. Mark it complete only after every blocking server acceptance item and the server handoff package pass. `NEEDS_MATH_SIGNOFF` may remain only when it cannot alter the Reel-facing layout, frame/state transitions, payout amounts, or response contract, and it must stay visible in the handoff. Follow the goal tool's own blocked-status policy; an ordinary first failure is a workflow Gate, not permission to force a blocked or completed goal state.
4. Create the client objective only after the server goal is complete. Tie it to the same roadmap hash, client detailed-plan hash, and accepted server handoff.
5. Mark it complete only after client identity migration, formal `s_cli` Reel execution, and applicable runtime/cross-end acceptance pass.

If the goal mechanism is unavailable, return `GOAL_TOOL_UNAVAILABLE`. If another unfinished goal exists, return `GOAL_CONFLICT`. Preserve the execution state and do not silently substitute a checklist.

## Server foundation and identity phase

The server repository Gate and base-code Gate are separate. A repository is implementation-ready only when the baseline inspector confirms:

- a non-empty `go.mod` with a valid module directive;
- an ordinary non-test Go entry file declaring `package main` and `func main`;
- at least one ordinary non-test Go source representing game/module behavior outside dependency/generated trees;
- at least one ordinary runtime configuration or scheme file under an owned configuration root;
- no required path traverses a reparse point.

Before implementing game rules, `s_ser` must inventory and migrate server-owned identity surfaces:

| Surface | Required decision and evidence |
| --- | --- |
| Go module/package/command | Target repository/module and executable entry are consistent; SDK dependency paths are not renamed as game IDs. |
| Game registration | Registration key, game code, and manager/bootstrap selection use `replicationId` or an explicitly documented case form. |
| Route and storage identity | REST game path, `WithGamePath`-style option, Redis prefixes, seed/cache/table names, and state namespaces are target-owned. |
| Configuration and scheme | YAML/JSON/TOML keys, scheme names, environment variables, defaults, and validation errors identify the target. |
| Build and startup | Makefile/task scripts, PowerShell/shell launchers, Dockerfile/compose, binary and PID/log names use the target identity. |
| Packaging and CI | `.github/workflows/**`, image/artifact names, build inputs, repository references, tag filters, and deployment variables are target-owned. |
| Remaining donor values | Every match is removed or recorded with path, meaning, evidence, and reason it must remain. |

Identity migration must pass focused static checks and a build before rule implementation begins. Build success does not prove registration, route, package output, or runtime identity; verify those separately.

## Server implementation and coexistence phase

Run the formal `s_ser` loop against the server workstream and `doc/s_init/server/detailed-replication-plan.md`. Tests and fixtures must cover the accepted protocol and changed rules. Before local startup, apply the complete coexistence Gate from `s_ser`; never kill or reconfigure an unrelated process to obtain a port.

Store all new coordination documents and evidence below `<project>/doc/s_init/server/` while in `s_init execution` mode. Server and simulator source changes remain in their owning repositories, but do not create or update runner `README.md` or runner `doc/**` from this mode.

The server handoff package must include:

- target and donor identity inventories plus residue classification;
- exact server commit/baseline and admitted dirty files;
- build/package/start commands and artifact identity checks;
- deterministic request, seed provenance, raw response, SHA-256, and response-contract summary;
- focused tests and results;
- simulator route/result;
- target REST/gRPC/Redis/MySQL allocation and owner PIDs;
- before/after probes proving all pre-existing runners still coexist;
- blocking and non-blocking Gates.

`LOCAL_RUNTIME_PASS` requires ownership and coexistence evidence. `SIMULATOR_PASS` requires the simulator to consume the target response. Neither an open port nor HTTP 200 is sufficient.

## Client identity phase

The completed server handoff is an input, not an external path exception. Save or recapture the required raw fixture below the client task's `doc/s_cli/**` directory before a formal plan references it.

Inventory these client-owned surfaces before editing:

| Surface | Required decision and evidence |
| --- | --- |
| Cocos Scene | Scene asset/file identity, configured launch scene, serialized game-specific strings, and the paired `.meta` relationship. Preserve the existing Scene UUID and update the active database URL/name reference; do not replace `startScene` with a guessed UUID. |
| Project/settings | Project name/UUID-owned settings, `slot_{replicationId}` bundle or service identifier, build/preview profiles, and package metadata. |
| Runtime configuration | Trace the actual `GameConfig -> gameConfig.json -> Host config` precedence, then update resource/bundle keys, API game code, routes, storage keys, and environment overrides only at proven owners. |
| TypeScript ownership | Target-owned class/file/config names that encode the donor identity; do not rename shared Bridge or SDK APIs. |
| Packaging and CI | `package.json`, the active build profile/config, `.github/workflows/**`, artifact/bucket/image variables, tag filters, and deployment game identifiers. Historical profiles remain unchanged unless an active consumer is proven. |
| Serialized assets | Prefab/Scene references, script UUIDs, asset UUIDs, and `.meta` files; use Cocos-aware rename/edit/validation. |
| Remaining donor values | Every match is removed or recorded with path, meaning, evidence, and reason it must remain. |

Run identity migration as the first formal `s_cli` slice. It must pass configuration parsing, TypeScript/static checks, scene/meta reference checks, build-profile checks, and a Cocos project/launch-scene smoke check before Reel implementation starts. A GitHub workflow parse or local build does not prove deployment.

## Reel implementation phase

Run a second formal `s_cli` slice for Reel/Spin/SlotReel, using the project plan and `doc/s_init/client/detailed-replication-plan.md` as planning inputs rather than as an executable `plan.json`. The task must still establish `ROOT_CAUSE`, use the GPT-6 thinking route to produce the five-row Reel module choreography matrix, inspect `assets/resources/{replicationId}_res/` before choosing any replacement, prefer a suitable target-local Prefab over an inherited legacy Prefab, create and validate its own version 2 plan, restrict writes to admitted files, and pass `serverDataCheck` using a client-owned raw artifact. A retained legacy Prefab needs an evidence-based compatibility reason; import/binding work must preserve serialized references and `.meta` UUID relationships. After a replacement, use the new resource Prefab's serialized values as the baseline. The old Prefab may identify the owner, consumers, and binding risk, but its position, rotation, scale, anchor, size, opacity, active state, and component defaults must not be copied into the new Prefab. Adjust a new value only when target-local resource, archived JS, or runtime competitor evidence proves that adjustment.

Acceptance must cover the five explicit modules: Reel core, Reel background, Drop peeking, Spin peeking, and Elimination. For every module, verify the evidenced VFX/effect, animation/timing, audio, completion callback, and cleanup/restore as one choreography contract, in addition to layout dimensions and index mapping, initial symbols, normal stop, Turbo/Stop where supported, mask/clipping, long or special symbols, drop/cascade callbacks, and relevant Free Game/Bonus transitions. Mark unsupported behaviors `UNKNOWN` rather than implementing from the quick-reference checklist alone.

## Recovery rules

- Missing, draft, blocked, stale, hash-mismatched, or baseline-mismatched client/server detailed plan: return `NEEDS_CLIENT_DETAILED_PLAN`, `NEEDS_SERVER_DETAILED_PLAN`, `NEEDS_DETAILED_PLAN_REVIEW`, or `NEEDS_DETAILED_PLAN_REFRESH` as applicable; do not create the server Goal.
- Incomplete targeted runtime sampling: `NEEDS_TARGETED_COMPETITOR_SAMPLE`; preserve actual counters and partial plans, then resume sampling before implementation.
- Incomplete server baseline: `NEEDS_SERVER_BASE_CODE`; ask the user to initialize the runner foundation, then rerun the baseline inspector.
- Server identity residue on an owned runtime/package surface: `SERVER_IDENTITY_INCOMPLETE`; stay in the server goal.
- Conflicting slug, provider, route, build, or package identity evidence: `IDENTITY_MAPPING_CONFLICT`; freeze the mapping before editing either repository.
- Port, storage, or dependency collision: `NEEDS_ISOLATED_RUNTIME`; preserve all existing processes and choose another target-owned allocation.
- Server no longer available before the client Goal is created: create a separate server recovery Goal and apply coexistence checks again. If the client Goal is already active, return `NEEDS_SERVER_RECOVERY`, preserve it without marking it complete or replacing it, and follow the goal mechanism's recovery/blocked policy before any `s_ser` mutation. `s_cli` must never restart the server itself.
- Unresolved runtime game-code or Host/config precedence: `NEEDS_PROTOCOL_EVIDENCE`; do not change the uncertain client value.
- No provable active Cocos build profile: `NEEDS_ACTIVE_BUILD_PROFILE`; do not rewrite historical builder profiles.
- A requested Scene/Prefab rename would require guessing a UUID, file ID, or script binding: `SERIALIZED_IDENTITY_UNRESOLVED`; stop for Cocos-aware evidence.
- Client identity residue on an owned surface: `CLIENT_IDENTITY_INCOMPLETE`; do not begin Reel implementation.
- Verification failure: preserve command output, request/seed, logs, and current phase; return to the owning skill's evidence/root-cause phase.
- Dirty target file outside the admitted plan: `DIRTY_FILE_CONFLICT`; never reset, stash, overwrite, or absorb it implicitly.
