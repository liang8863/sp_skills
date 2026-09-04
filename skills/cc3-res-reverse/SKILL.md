---
name: cc3-res-reverse
description: 'Use when the user explicitly writes @cc3 or @cc3_res with a local PG Cocos project named {gameId}_UI and either an explicit competitor http(s) URL or a valid URL previously recorded for that project in doc/project_info.md. Establish and record a target-root Git baseline commit before the first project-file mutation, preserve every Prefab and Prefab meta without deletion, normalize the final resource root to assets/resources/{gameId}_res, reverse compiled JavaScript into Cocos 2.4 TypeScript under the s-cli-agent JS reverse guide, migrate every direct-child game script into Cocos Creator 3.8.7 TypeScript, remove active direct-child JavaScript from the formal scripts directory, preserve script UUIDs, bind final TS classes in Prefab/Scene/Resource data, and prove zero unresolved or Missing Script components. Always run a translation-feasibility probe before semantic work; if no authoritative converter or equivalent source exists, stop with an explicit blocker instead of creating placeholder TS. During conversion and binding, apply the high-risk script and numeric-atlas checklist, especially for NumberDisplay* and related rolling/display consumers.'
---

# CC3 PG Reverse And TypeScript Integration

## Command Contract

Treat `@cc3` as an end-to-end PG resource and script conversion command. Complete these stages in order:

1. Resolve the `<gameId>_UI` project path, derive the exact `<gameId>` from its leaf directory, and select an explicit or valid matching stored competitor URL without writing project files.
2. Initialize or verify a Git repository rooted at the target project and create the required baseline commit before the first project-file mutation.
3. Create or validate `doc/project_info.md`, including the verified baseline commit id.
4. Inventory every Prefab and its meta, then pass the mandatory all-Prefab legacy script-reference gate without deleting or overwriting either file type.
5. Normalize the final resource root to `assets/resources/<gameId>_res/` while preserving every Prefab and its meta.
6. Reverse eligible direct-child `assets/scripts/*.js` into Cocos 2.4 TypeScript under `assets/scripts_ts24/`.
7. Migrate TS24 into Cocos Creator 3.8.7 TypeScript under `assets/scripts_ts3/`.
8. Replace converted formal JavaScript with final TypeScript under `assets/scripts/`, preserve each original script UUID, refresh/compile the current Cocos project, bind serialized script components to the generated Cocos 3 class ids, and re-run structural, editor, and all-Prefab validation. Do not report completion while a script mapping, import, compile, or Missing Script result remains unresolved.

The final active project layout is:

```text
assets/
  scenes/
  scripts/                         # final TS3 for every direct-child business script; no active direct-child JS
  resources/
    <gameId>_res/
      <all non-scene resources>
migrationArtifacts/                # outside assets; never imported by Creator
  scriptsJs/                       # byte-for-byte original JS and .js.meta evidence
  scriptsTs24/                     # archived TS24 work product and progress records
  scriptsTs3/                      # archived final TS3 work product and progress records
doc/
  project_info.md
  <project>-resource-inventory.md
  <project>-operation-flow.md
  <project>-script-binding-report.md
```

Do not leave translated copies in active `assets/scripts_ts24/` or `assets/scripts_ts3/` after final integration. Cocos imports scripts anywhere under `assets`; duplicate `@ccclass` definitions or duplicate script UUIDs make the final validation invalid. Archive those workspaces only after the final files are safely installed and verified.

## Non-Destructive Prefab Invariant

Treat every `.prefab` and matching `.prefab.meta` found by the pre-conversion inventory as mandatory project data.

- Never delete a Prefab or its meta at any stage, including cleanup, deduplication, conflict resolution, resource normalization, script replacement, binding, or validation. Do not discard a Prefab merely because it is duplicate, orphaned, obsolete-looking, broken, or currently unreferenced.
- Never overwrite one Prefab or Prefab meta with another. If a destination conflict prevents a one-to-one move, stop and report both paths instead of choosing a winner.
- Permit path moves only during authorized resource normalization. Before moving, record every source-to-destination path, Prefab UUID, meta UUID, and file count; after moving, prove that every inventoried pair still exists exactly once at its mapped destination.
- Permit Stage 3 to change only the proven serialized script `__type__` occurrences required for binding. Such edits do not waive the no-deletion rule.
- Require final Prefab and Prefab-meta count parity with the pre-conversion inventory and report `deletedPrefabCount: 0` and `deletedPrefabMetaCount: 0`. Treat any missing pair, unexplained count change, or overwritten UUID as a blocker.

## Documentation Authority

Resolve `.codex/agents/s-cli-agent/references/JS_TO_COCOS24_TS_REVERSE_GUIDE.md` and `pg-reverse-toolkit/` from the current `slot-fe-client` repository root. Do not use a hard-coded machine path.

Before JS-to-TS24 work, read `.codex/agents/s-cli-agent/references/JS_TO_COCOS24_TS_REVERSE_GUIDE.md` completely. Treat it as the primary and controlling authority for Stage 1. If this guide is missing or unreadable, stop instead of silently falling back to a different copy. When another skill, summary, toolkit document, existing project convention, or this file conflicts with that guide on JS-to-TS24 behavior, follow the s-cli-agent guide and remove the conflicting behavior from the execution plan.

Also read these local toolkit files completely for their separate responsibilities:

- `pg-reverse-toolkit/readme.md`: PG workflow and shared-library context.
- `pg-reverse-toolkit/JS_TO_COCOS24_TS_IGNORE_MODULES.txt`: Stage 1 ignore-list authority.
- `pg-reverse-toolkit/cocos24_to_cocos387_reverse_guide.md`: Stage 2 and final integration authority.

Read `pg-reverse-toolkit/COCOS38_PITFALLS.md` before final resource binding, editor refresh, or runtime validation, and apply its relevant Prefab and editor safeguards. Treat the checked-out toolkit as authoritative only for the separate responsibilities listed above; it must not override the controlling s-cli-agent guide during Stage 1. Do not browse or substitute a remote version unless the user explicitly requests it.

This toolkit is PG-specific. If the supplied competitor is not PG/PG Soft or the source layout does not match the documented PG reverse output, stop and request a separate compatibility assessment instead of applying the rules mechanically.

Use `JS_TO_COCOS24_TS_IGNORE_MODULES.txt` as the single ignore-list authority. Copy it byte-for-byte to the target project root when the project does not already contain the same file, so dependency and count checks use one reproducible list. Do not expand the list merely to avoid difficult conversions.

The ignore list only removes modules from the semantic TS24 batch; it is not permission to keep JavaScript in the final project. For every ignored direct-child script, install an audited toolkit/shared TS3 implementation or perform the same source-preserving TS3 migration used for non-ignored scripts. Do not silently prefer or copy a shared implementation from a shipped sibling project. If the toolkit readme indicates that its snapshot may be stale, follow the Stage 1 equivalent-source workflow before reading another project: announce the exact read-only search roots and purpose, compare the candidate against the current JS, record evidence, and never overwrite a different implementation without a proven mapping.

## Translation Feasibility Gate

Run this gate immediately before creating semantic TS24 output. It prevents a long, misleading run when the repository contains only compiled Cocos JavaScript and no restoration tool or source equivalent.

1. Probe the current repository and approved local toolkit roots for an executable JS-to-TS24 converter, a checked-in restoration script, source maps with real `sourcesContent`, or an equivalent TypeScript source set. Record the exact paths and versions that were checked.
2. A Cocos-generated source map whose `sourcesContent` is the same `__extends`/`__decorate` CommonJS wrapper is still compiled output, not an authoritative TS source. A raw `.js` rename, `allowJs`, `// @ts-nocheck`, wrapper import, or placeholder class is not a translation result.
3. Count both the full direct-child eligible set and the Prefab-bound reachable set. Reachability can prioritize batches, but it never reduces the required eligible count.
4. If no authoritative converter or equivalent source is available, write `BLOCKED_NO_AUTHORITATIVE_TRANSLATOR` to the progress and binding reports, keep the original JS as the sole behavior source, and stop before Stage 2 or Stage 3. It is valid to create progress documents, dependency inventories, and read-only evidence; do not create decorated TS copies under `assets/` because Cocos imports scripts from every asset subdirectory.
5. Never invent a hash, UUID, class id, candidate count, or runtime result to fill an evidence field. Use `unknown` and explain the missing observation, or do not record the candidate as accepted.

This gate is a translation blocker, not a resource failure. Continue safe resource inventory and validation, but report `translated`, `formally installed`, `class-id bound`, and `runtime verified` as separate states.

## Bundled Verification Scripts

Use the deterministic scripts under `scripts/` instead of retyping ad hoc scanners. They emit JSON suitable for the project reports and return a non-zero exit code on a blocking mismatch.

- `node scripts/verify-resource-move.mjs --repo <project> --baseline <commit> --game-id <id>` compares every pre-move Git blob with its mapped destination and reports `checked`, `missing`, and `mismatch`.
- `node scripts/inventory-high-risk-prefabs.mjs --repo <project> --game-id <id>` inventories every high-risk component, serialized field set, frame count, frame UUID order, and nested controller binding after resource normalization.

Run the resource script only after the authorized move and run the high-risk inventory before TS/binding writes and again after final binding. Store the command, timestamp, and JSON result; the scripts do not replace editor class or runtime probes.

## Required Inputs And Metadata Gate

Resolve only the explicit local project path. If no path is supplied, use the current workspace only when it is a Cocos project; otherwise request the path. Stay inside that project for project mutations. Exclude `library/`, `temp/`, `build/`, and `node_modules/` from scans, reports, and commits.

Require the resolved project leaf directory to match `^(?<gameId>.+)_UI$` case-insensitively with a non-empty prefix. Derive `<gameId>` by removing only the trailing `_UI` and preserve the prefix spelling and casing exactly. Do not derive it from a leading `UI_`, do not lowercase it, and do not infer it from another file or sibling directory. If the project leaf does not match this convention, stop and request a correctly named project path before any project mutation.

Before resolving the competitor URL, permit only project-path resolution and a read-only lookup of `<resolved-project>/doc/project_info.md`. Do not inspect project assets, Git state, history, search results, or similarly named games at this stage.

Resolve the competitor URL in this order:

1. Use a URL supplied directly in the current request when it is an absolute, non-placeholder `http://` or `https://` URL.
2. Otherwise, read the exact `uiProjectPath`, `gameId`, and `competitorUrl` keys from `doc/project_info.md`. Reuse `competitorUrl` without asking the user only when it is an absolute, non-placeholder HTTP(S) URL, `uiProjectPath` normalizes to the resolved project path, and `gameId` exactly equals the prefix derived from the `<gameId>_UI` project directory.
3. If neither source provides a valid URL, stop before every other project operation and request an absolute competitor HTTP(S) URL.

Do not infer the URL from any other file, history, search, or similarly named game. If a valid URL supplied in the current request differs from a valid matching stored URL, stop and ask which URL is authoritative before overwriting metadata or continuing.

After resolving the URL, satisfy the Git baseline gate before creating or updating `doc/project_info.md`. Then write these exact keys before the Prefab gate:

```markdown
# Project Info

- `uiProjectPath`: `<absolute resolved project path>`
- `gameId`: `<derived game id>`
- `competitorUrl`: `<resolved absolute HTTP(S) URL>`
- `gitBaselineCommit`: `<verified full commit SHA>`
```

Preserve unrelated user content. Never write an inferred URL or placeholder value. Treat the stored URL as project metadata only; do not access or scrape it unless the user separately requests competitor analysis.

## Git And Baseline Safety

Satisfy this gate after URL resolution and before writing metadata, normalizing resources, generating reports, converting scripts, or modifying any project file. Before the baseline commit, permit only `git init` at the resolved project root, Git-internal configuration under that root's `.git/` needed to create the commit, and the narrowly scoped post-authorization prerequisite repairs defined below.

Require the resolved project root to be its own Git top-level:

1. Inspect `<resolved-project>/.git` and run `git -C <resolved-project> rev-parse --show-toplevel` when possible. An ancestor repository does not satisfy this gate.
2. If the project has no repository whose top-level equals the resolved project path, run `git init` in the resolved project root even when an ancestor worktree exists. Do not initialize any parent or sibling directory.
3. Honor the target project's existing `.gitignore` when staging a baseline; never force-add ignored paths. Configure `library/`, `temp/`, `build/`, and `node_modules/` in the target repository's Git-internal exclude configuration when they are not already ignored, but do not create or edit a project `.gitignore` solely for this pre-baseline exclusion. Git ignore rules do not suppress already tracked files, and `:(exclude)library/**` does not exclude the tracked root entry itself. The staging command must therefore exclude both each generated root and its descendants, for example `:(exclude)library` plus `:(exclude)library/**`, and likewise for `temp`, `build`, and `node_modules`.
4. If the target repository has no commit, stage the original project state that is not ignored or explicitly excluded and create one baseline commit with message `chore: establish cc3 baseline`. Use a scoped `git add -A -- .` command with exclusion pathspecs for both `library`/`library/**`, `temp`/`temp/**`, `build`/`build/**`, and `node_modules`/`node_modules/**`; never use `git add -f` or a broad command that can re-include generated output. In a newly initialized target repository, all non-generated files under that exact project root are in baseline scope.
5. If the target repository already has commits but no valid recorded `gitBaselineCommit`, use exactly one of these paths:
   - Clean worktree: create the dedicated baseline marker with `git commit --allow-empty -m "chore: establish cc3 baseline"`.
   - Dirty worktree: list the complete tracked and untracked set and stop before staging. If the user explicitly confirms the exact original-baseline scope, including any named generated-root exclusions, stage only the confirmed non-ignored, non-excluded set and create one non-empty `chore: establish cc3 baseline` commit; this commit itself is the baseline, not a preliminary cleanup commit. A generic instruction such as "continue" is not authorization. Without complete explicit authorization, keep the gate blocked until the user handles the worktree; do not revert, stash, stage, or commit it automatically. Once the user makes it clean, use the clean-worktree path.
6. Before a non-empty baseline commit, inspect `git status --short --untracked-files=all`, `git diff --cached --stat`, the staged diff, and `git diff --cached --check`. Verify that the staged set contains only the intended original project files and no generated or unrelated files. Also inspect the staged path list and prove that no path under an explicitly excluded generated root, including `library/`, `temp/`, `build/`, or `node_modules/`, is staged; this check is required even when `.gitignore` contains those roots because they may already be tracked.
7. After the user explicitly authorizes the exact baseline set, permit Codex to repair a baseline prerequisite failure only when the repair is minimal, deterministic, confined to an already confirmed file, and provably does not change runtime semantics or serialized asset identity. Announce the exact file and reason before editing. Examples include removing trailing whitespace or an extra blank line at EOF reported by `git diff --cached --check`. Do not change code behavior, data values, UUIDs, `fileId` values, resource content, or the authorized file set; do not add, delete, rename, or move files. Re-stage only the repaired confirmed file, then re-run the full staged-set audit and all prerequisite checks. Treat any ambiguous or semantic repair as a blocker.
8. If `doc/project_info.md` already records `gitBaselineCommit`, reuse it only when the target repository top-level matches the resolved project, the value resolves to an existing commit, and it is an ancestor of or equal to `HEAD`. Otherwise stop; never replace a missing or invalid historical baseline silently.
9. After creating a baseline, verify `HEAD`, record its full SHA as `gitBaselineCommit`, and require the baseline commit to succeed before any other project mutation. If author identity or another commit prerequisite is missing, stop and report the exact prerequisite rather than inventing identity values.

Preserve unrelated dirty and untracked work. Keep later phase commits limited to the current conversion work and never mix unrelated user changes into them.

## Mandatory Pre-Conversion Prefab Gate

Run this gate after metadata output and before resource normalization or script conversion. Cover every `assets/**/*.prefab`.

1. Parse each Prefab structurally and inventory every script component: Prefab path, node path, component index, serialized `__type__`, resolved script path, script UUID, `.meta` UUID, class id, and status.
2. Resolve references through Cocos/MCP or an equivalent editor-backed validator. Text search is supplemental only.
3. Detect literal Missing Script markers, empty/null `__type__`, missing scripts, missing/mismatched meta files, duplicate UUIDs, unresolved compressed class ids, parse/load failures, and imports that prevent a component from loading.
4. Repair only a proven legacy script-reference miss using existing script, meta, binding, or current editor class-registry evidence. Preserve the original legacy script UUID. Never invent a UUID or class id.
5. Re-run the full scan after each repair. Require zero blocking misses and `missingCount: 0` for every available `validate_prefab_references` result.

Treat ambiguous, non-script, runtime-only, or editor-unavailable results as blockers. Record the exact file, component, evidence, attempted repair, and next action. Do not claim that a clean text search proves a valid class binding.

### Editor validation boundary

Before using a Cocos MCP wrapper, prove that the server identity, project path, Creator version, and active profile match the resolved target. A valid MCP response from another game is not target evidence. `validate_prefab_references` checks ordinary AssetDB `__uuid__` resolution only; `missingCount: 0` does not prove script class registration, serialized property binding, or runtime behavior. If the result has empty file paths or no enumerated refs, classify it as partial smoke evidence and require an editor class probe for the affected component.

For a missing ordinary material or effect reference, first inspect the target project's own importer/default-asset catalog and its UUID mapping. An exact target-owned built-in file with the referenced UUID may be restored byte-for-byte and revalidated; do not synthesize a material, copy a sibling material with a different UUID, or treat a zero-missing result as proof of script binding.

## High-Risk Script And Numeric Atlas Checklist

Use this list during Prefab inventory, TS24/TS3 mapping, and final binding. It is a targeted review set, not an ignore list: every eligible module still follows the normal conversion and UUID rules. Record the matched paths and hit counts in `<project>-script-binding-report.md`, including zero hits for a group when that fact is useful to explain coverage.

### Script name groups

| Match group | Typical names | Why it needs extra review |
|---|---|---|
| Numeric display chain | `NumberDisplay*` (`NumberDisplayController`, `NumberDisplayInterface`), `NumberRoll*` (`NumberRollController`, `NumberRollBaseController`, `NumberRollLabelController`, `NumberRollCurveController`), `NumberCurvedController`, `NumberLabel*`, `RemainingNumber*` (`RemainingNumberDisplayController`, `RemainingNumberEffectController`), `TimedWinRoll*`, `WinRoll*`, `CustomNumberDisplay*`, `FeatureBuyNumberDisplay` | These classes depend on serialized child nodes, display-controller overrides, and ordered digit SpriteFrames. A valid script class with an incomplete binding still renders blank or falls back to a plain Label. |
| Numeric display consumers | `*BonusLoading*` (`BonusLoadingController`, `HbfyBonusLoadingPanel`), `*TotalWin*` (`TotalWinController`, `HbfyTotalWinPanel`, `SGTotalWinController`), `*BigWin*` (`BigWinController`, `HbfyBigWinController`, `SGBigWinController`), `*Multiplier*` (`MultiplierController`, `MultiplierHolderController`, `FreeSpinMultiplierController`), `*InfoBoard*` (`HbfyInfoBoardController`, `InfoBoardController`), `Infoboard*` (`InfoboardTipsController`, `InfoboardMessageController`, `SGInfoboardMessageController`), `*SpinButton*` (`QiBaseSpinButtonController`, `HbfySpinButtonController`, `SpinButtonController`), `FeatureBuy*`, `WaysController` | These controllers often resolve a nested NumberDisplay/NumberRoll component at runtime and are sensitive to path, class-id, callback, and lifecycle drift. |
| Resource and pool binders | `SymbolAsset*` (`SymbolAssetController`), `*SlotItemPool*` (`SlotItemPool`, `GameSlotItemPool`), `AnimParticleSystem*` (`AnimParticleSystem`, `AnimParticleSystemPoolHandler`), `*FixedWild*` (`HgcsFixedWildEffectController`), `WildPayout*` (`WildPayoutEffectPlayer`), `*Atlas*` (`ResConfig`, atlas-loading helpers) | Their Prefab bindings commonly combine SpriteFrame/atlas references, pooled nodes, or legacy component IDs; a text-only UUID scan is not sufficient. |

Also include `Legacy*` and `Compat*` wrappers whenever their names contain one of these tokens, for example `LegacyHgcsNumberDisplayController`, `LegacyNumberDisplay`, `LegacyNumberRoll`, and `LegacyTimedWinRollController`. These wrappers are frequent bridges between a preserved legacy UUID and a current Cocos 3 class id, so prefix-only matching must not exclude them.

When searching numeric atlas data, include common frame families such as `info_0..info_9`, `big_0..big_9`, `auto_0..auto_9`, `mtp_*`, comma/decimal frames, and locale title frames. These are search hints only; never synthesize or reorder frames from the names. The source Prefab and target atlas metadata remain authoritative for the exact set, order, and UUID.

Freeze the high-risk resource contract before any TS or binding write. Save, per component instance, the serialized field set, `fileId`, exact frame count, frame index-to-UUID mapping, atlas/meta path, punctuation/special-frame entries, and InfoBoard message asset fields. For InfoBoard, compare each component instance independently; equal script names or UUIDs do not imply equal fields. A missing word/sprite entry, a different `numberDisplayController` presence, or an atlas override is a blocker until the source behavior and target AssetDB resolve it.

### Required checks for every hit

1. Compare the source and target node path, component type, `@property` field name, `fileId`, and ordinary asset UUIDs. Preserve target `fileId` and all non-script serialized values; do not accept a filename or UUID match as proof of equivalence.
2. For `NumberDisplay*` and every consumer that owns one, inventory the exact `numberSprite`, `numberBlurSprite`, `sheet`, `numberSpriteAtlas`, punctuation/special-frame fields, `numberContainer`, `nodeNumberWidth`, `nodeNumberScale`, and `maxContainerSize` values when present. Compare frame count, frame name, order, and target-resolved UUID one by one. Ten, twelve, and thirteen frame arrays are all observed in shipped projects; do not assume a fixed length or infer missing entries from a sibling atlas. The source Prefab is authoritative.
3. Verify the runtime component constructor/class registration and the `NumberRoll*` or `TimedWinRoll*` `displayController` type from the current Cocos editor. A serialized `NumberDisplayController` accidentally loaded as `cc.UIOpacity`, an unresolved legacy class id, or a null nested controller is a blocking binding defect.
4. Check that runtime language/atlas loading does not overwrite a serialized digit `sheet` with a text atlas unless the source behavior proves that assignment. A `numberSpriteAtlas` override can take precedence over valid digit frames and make a display blank or show the wrong glyphs.
5. Resolve every digit and special frame through the target asset database after refresh. Verify that the atlas path, atlas `.meta`, subasset frame names, and UUIDs agree with the target project. If the source uses Cocos 2.x `.plist`, apply the toolkit D3 rule; do not treat copying the `.plist` and `.png` as a valid Cocos 3.8 SpriteFrame binding.
6. Exercise the smallest useful runtime path for each hit: `clear`, `displayNumber`, roll/skip completion, and the owning controller's callback. Confirm the expected node becomes visible, no plain `amount_label` fallback is created when sprite-number rendering is required, and no `Sprite` remains with a null `spriteFrame`.
7. Validate through `node.components` and editor/MCP inspection, not `getComponent()` alone. If the editor or asset database is unavailable, mark the result as unresolved and stop the related integration gate.

### Acceptance evidence

The script-binding report must include, for every non-zero hit, the source and target script path, preserved original UUID, current generated Cocos 3 class id, affected Prefab/node paths, numeric frame count/order/UUID comparison, atlas/meta resolution result, runtime probe result, and any fallback or unresolved state. Final validation must show no stale class id, no unresolved frame UUID, no unexpected atlas override, and no missing numeric display component for an affected node.

## Resource Normalization

After the Prefab gate, normalize resources as follows:

1. Create or reuse the exact final root `assets/resources/<gameId>_res/`, using the `<gameId>` derived from `<gameId>_UI` without case conversion.
2. Move every direct child of `assets/resources/` into that root, including files and `.meta` sidecars. Do not move the destination or its own `.meta`.
3. Move legacy `assets/prefabs/` and its folder meta to `assets/resources/<gameId>_res/prefabs/` when present. Move every contained Prefab together with its meta; never delete or overwrite either one, and stop on any destination conflict.
4. Preserve every file byte-for-byte and preserve all resource UUIDs.
5. Scan scripts, configuration, and serialized data for path-string references to the moved paths before writing. Treat each path-string reference as a blocker unless a separately authorized deterministic migration covers it.
6. Keep `assets/scenes/`, scripts, plugins, import materials, and unrelated directories outside this move.

After the move, prove byte identity rather than relying on counts: compare every pre-move blob from the baseline tree (for example, `git ls-tree` plus `git hash-object`) with its mapped destination. Require `missing=0` and `mismatch=0`, and record the checked file count. A successful editor refresh cannot replace this proof.

A successful normalization leaves only `<gameId>_res/` and its folder meta as direct children of `assets/resources/`, with `<gameId>` matching the prefix of the `<gameId>_UI` project leaf exactly. It also preserves a one-to-one source/destination mapping for every inventoried Prefab and Prefab meta.

## Stage 1: JavaScript To Cocos 2.4 TypeScript

Follow the s-cli-agent JS reverse guide directly. Use direct-child `assets/scripts/*.js` as the immutable semantic source and `assets/scripts_ts24/` as the work area. Do not silently include nested JS files; inventory them separately and request an explicit scope decision if they exist.

1. Establish the JS count baseline, apply only the authoritative ignore list, and inventory imports/`require(...)`, exports, decorators, serialized fields, prototype methods, getters/setters, call sites, inheritance, and dependency cycles.
2. Build `assets/scripts_ts24/_dependency_order.txt`. Convert dependency-first: constants/enums/tools, models/config/repositories, framework/helpers, UI controllers, slot controllers/state machines, then entry points. Record cycles without restructuring them.
3. Before hand-restoring heavily minified or renamed code, evaluate whether user-authorized sibling projects from the same vendor/framework/version may contain an equivalent JS or restored TS source. Before reading outside the current project, tell the user the exact search roots and purpose. Keep all external-project access read-only and never create a build dependency on it.
4. Do not accept a candidate because its filename or UUID matches. Compare module dependencies and usage, export semantics, inheritance, prototype/getter/setter shape, decorator fields and order, strings/constants/resources, control flow and callback order, and game-specific reel/bonus/audio/config differences. Use hashes, normalized AST, UUIDs, and structural fingerprints to narrow review, but never treat one signal as proof.
5. When cross-project search occurs, reuse the project's existing equivalent-source evidence record; otherwise create one project-level `TS_REUSE_EVIDENCE.json`. For every candidate, record current and reference paths, hashes captured from the filesystem, UUID comparison, AST/structure/manual evidence, status and differences, and whether the result was fully reused, used only for names/types/structure, or rejected. Candidate totals must be derived from the recorded file list; never fill hashes or counts with placeholders. Do not create competing evidence files for the same process.
6. Reuse a fully equivalent TS candidate only after auditing it against the current JS. For partial matches, borrow only proven names, types, or class structure and rewrite current-project differences. The current project's JS remains the sole runtime behavior source; never infer its rules, protocol, RTP, configuration, or gameplay from a reference project, and never inherit reference `.meta` files or UUIDs.
7. Restore module structure, classes, `cc._decorator`, `@ccclass`, `@property`, import/export shape, callbacks, semantic names, types, member access, prototype methods, and getters/setters. Preserve Cocos 2.4 APIs and the exact state-machine, spin/result/prize/bonus, resource-loading, schedule/action/event/callback order.
8. Keep ignored CommonJS dependencies as explicit boundaries or connect the verified shared implementation. Do not duplicate broad local interfaces for ignored components. Replace temporary interfaces with real TS types or role-named boundary interfaces before closeout.
9. Treat the ignore list as a Stage 1 scheduling rule only. Every ignored direct-child module still needs a documented TS3 source, preserved original UUID, final `.ts.meta`, and formal `assets/scripts/<relative>/Foo.ts` installation. If the toolkit snapshot does not cover an ignored module, the module is not exempt; restore it from the current JS or stop with a named blocker.
10. Record batches, source/equivalent files, restored semantics, type decisions, dynamic boundaries, risks, commits, and exact checks in `assets/scripts_ts24/TS_REVERSE_PROGRESS.md`.
11. Reuse existing general parse/type/prototype checks for each batch. Do not create a dedicated mock or behavior snapshot for every ordinary module. Add only the smallest one-off behavior check when static comparison cannot prove a high-risk state transition, data transform, resource load, asynchronous handoff, event cleanup, pool lifecycle, or animation callback; record its risk and exit condition.
12. Freeze the Stage 1 file list, commands, and blocker definitions before closeout. Classify every result as blocker, false positive, or documented allowed boundary; fix only Stage 1 blockers and rerun the same frozen checks. Require count parity after ignores, full parse success, prototype/getter/setter/decorator/export parity, correct callback identity and order, consistent member access, and no recoverable `any`, broad `Function`, recoverable `unknown`, placeholder types, compiled wrappers, or unexplained completed-TS dependencies on JS.
13. Run an editor import probe before and after each conversion batch. Bare CommonJS specifier failures such as `Unresolved specifier Utils` or a dependent controller name are Stage 1 blockers until the dependency is restored or explicitly classified as an ignored boundary. Do not treat a successful static parse as proof that the Cocos module loader can import the batch.

Do not modify Prefab, Scene, Resource JSON, original JS, or original `.js.meta` during TS24 work.

## Stage 2: Cocos 2.4 TypeScript To Cocos 3.8.7

Use only the closed `assets/scripts_ts24/` output as the source and write `assets/scripts_ts3/`.

1. Keep one TS3 file for every non-ignored TS24 business script. Give every additional helper an explicit purpose.
2. For each Stage 1 ignored module, audit the selected toolkit/shared TS3 source in the same Cocos 3 project, record its source hash and target UUID mapping, and include it in the TS3 closeout even though it has no local TS24 reverse file.
3. Migrate `cc.*` globals to explicit imports from `"cc"`; migrate Node/UI properties, Action APIs, lifecycle, events, input, particles, component lookup, coordinate conversion, and serialized-property types according to the toolkit guide.
4. Preserve file names, default class names, editor-visible property names, callback identity, target/capture values, execution order, and real dynamic boundaries.
5. Use current Cocos 3 APIs rather than a broad Cocos 2 compatibility shim. Do not add fake `cc` declarations or a temporary tsconfig to mask migration failures.
6. Record batches, mappings, allowed boundaries, risks, and checks in `assets/scripts_ts3/TS3_MIGRATION_PROGRESS.md`.
7. Freeze the TS3 checks, then require full parse success and classification of every old-API, Node-property, lifecycle, component-lookup, `@property`, `any`, `Function`, placeholder-type, and formatting scan result.

Keep Prefab, Scene, Resource JSON, and existing meta bindings read-only until TS3 static closeout passes.

## Stage 3: Final Script Replacement And Binding

Run this stage only after both static stages pass.

### Preserve Comparison Evidence

Copy every original JS and `.js.meta` byte-for-byte to `migrationArtifacts/scriptsJs/`, preserving its path relative to `assets/scripts/`. Copy the closed TS24 and TS3 workspaces to `migrationArtifacts/scriptsTs24/` and `migrationArtifacts/scriptsTs3/`. Verify counts and hashes before removing any active source or staging file.

### Install Final TypeScript

For every direct-child `assets/scripts/Foo.js`, including modules listed in the Stage 1 ignore file:

1. Remove the active `Foo.js` and `Foo.js.meta` only after its verified backup exists.
2. Install the corresponding closed TS3 file as `assets/scripts/<relative>/Foo.ts`.
3. Let the current Cocos Creator 3.8.7 project generate a valid TS script meta/schema, then update only that generated meta's `uuid` to the original `Foo.js.meta` UUID through a structured edit.
4. Refresh/reimport and compile again. Verify `script path -> class name -> preserved full UUID -> current compressed class id` from the current editor or its current editor chunks.
5. Mirror the verified final `Foo.ts.meta` schema and preserved UUID into the matching `migrationArtifacts/scriptsTs3/` evidence path. Keep the archived TS source hash identical to the installed final source so downstream project creation can reuse the same class identity without reviving JavaScript.

Never keep formal `Foo.js` and `Foo.ts` together. Never rename editor-visible fields merely to improve style. An ignored module may use the selected audited shared TS3 implementation, but its active formal artifact is still `assets/scripts/Foo.ts` with the preserved original UUID; no direct-child JS exception is allowed.

After final installation, remove the active TS24/TS3 script copies under `assets/` only when their archived hashes match. Do not remove `migrationArtifacts/`.

### Bind Serialized Script Components

Generate a dry-run mapping before every serialized write. Include file count, occurrence count, old `__type__`, script/class name, preserved UUID, generated compressed class id, ignored-module hits, and unresolved values.

- Obtain compressed class ids only from the current Cocos project through editor APIs or current editor compile chunks. Never guess or hand-author them.
- Parse Prefab/Scene/Resource files structurally to identify script components. Restrict writes to their `__type__` values.
- Preserve ordinary asset `__uuid__`, `fileId`, `targetOverrides`, node/component `__id__`, property values, and all non-script serialized data.
- Do not JSON round-trip a Prefab or Scene. Apply exact, scope-limited replacements with expected occurrence assertions, then parse and structurally verify the result.
- Rebind every affected Prefab. If an affected `.scene` requires a write, first enumerate the exact scene files, reason, replacement counts, and risk, then obtain the explicit scene-file confirmation required by the `prefab-scene-json` workflow. Record zero scene writes when none are needed.
- Never delete, replace, merge, or overwrite a Prefab or its meta while binding. Stop if a binding cannot be completed without violating the non-destructive Prefab invariant.
- Treat an ignored module as complete only when its audited TS3 source is installed and class-id bound. An ignored module with active JS is an unresolved conversion gap, not a valid final boundary.

Scan for full-UUID script `__type__` values after replacement and classify every hit. A script component must use the current generated Cocos 3 class id. Never replace full UUID-looking values outside a structurally identified script component.

## Final Validation

Refresh the asset database, compile scripts, reload the preview when runtime validation is used, and verify that the preview is running the new bundle. Use Cocos MCP/editor validation when available.

Require all of the following:

- the target project's Git top-level equals the resolved project root, and `gitBaselineCommit` resolves to an existing commit that is an ancestor of or equal to `HEAD`;
- the project leaf is `<gameId>_UI`, and the only direct resource root is the exact `assets/resources/<gameId>_res/` directory plus its folder meta;
- every non-ignored eligible JS module has a TS24 and TS3 history plus a final formal TS file;
- every ignored direct-child JS module has an audited TS3 source and a final formal TS file, even when the source came from the toolkit shared snapshot;
- no direct-child `assets/scripts/*.js` or `.js.meta` remains active, and no formal JS/TS basename collision exists;
- any remaining nested/plugin JavaScript is outside the business-script scope, explicitly enumerated, and does not provide a final game component class;
- ignored-module and selected-shared-source records match the installed TS3 artifacts;
- every final `.ts.meta` has the preserved original script UUID and a current editor-generated class id;
- all Prefabs pass structural reference validation with zero Missing Script components;
- every pre-conversion Prefab and Prefab meta maps to exactly one final file, with count parity, preserved UUIDs, no overwrites, `deletedPrefabCount: 0`, and `deletedPrefabMetaCount: 0`;
- all changed Prefab/Scene/Resource JSON parses and retains valid `__id__` references;
- no unresolved script-component full UUID or stale class id remains;
- ordinary resource UUIDs, root/component `fileId` values, `targetOverrides`, and serialized property data did not drift;
- no active duplicate TS24/TS3 class copies remain under `assets/`;
- `git diff --check` passes.

If Cocos/MCP validation is unavailable, the asset database does not refresh, compile chunks are stale, a `.ts.meta` is missing, or a class id cannot be proven, stop with the final integration gate incomplete. Static parse success is not enough.

## Required Documents

Create or update these Chinese documents under `doc/`:

- `project_info.md`: authoritative UI-project metadata, including the verified Git baseline commit SHA.
- `<project>-resource-inventory.md`: all Prefab/script rows, resources, references, missing/orphan/duplicate findings, source-to-destination Prefab mappings, UUID/count parity, zero-deletion totals, and verification state.
- `<project>-operation-flow.md`: Mermaid startup and normal Spin/reel flow derived from verified scripts and Prefabs; label static-only evidence accurately.
- `<project>-script-binding-report.md`: JS/TS counts, ignore/shared decisions, TS24 and TS3 gates, original UUID preservation, final meta/class-id mapping, serialized dry-run/write counts, changed Prefab/Scene/Resource files, editor validation, and unresolved items.

When Stage 1 searches sibling projects, also keep the selected equivalent-source evidence record with the project records and include its path and accepted/rejected candidate counts in the script-binding report.

Keep `TS_REVERSE_PROGRESS.md` and `TS3_MIGRATION_PROGRESS.md` with their archived stage outputs.

## Completion Report

State the resolved `<gameId>_UI` project, exact derived game id, target Git top-level and baseline commit SHA, controlling s-cli-agent guide, and toolkit paths; metadata keys; Prefab preflight counts; final `assets/resources/<gameId>_res/` path; Prefab move mappings, count parity, preserved UUID totals, and zero deletion totals; source/ignored/TS24/TS3/final script counts; shared source; any external read-only search roots and reuse-evidence totals; archive paths; UUID/class-id mapping totals; serialized binding totals; exact Prefab/Scene/Resource files changed; all validation commands/results; runtime status; and untouched boundaries.

Explicitly distinguish `translated`, `formally installed`, `class-id bound`, and `runtime verified`. Report `@cc3` complete only when the final TypeScript is active and every required Prefab binding resolves in the current Cocos project.
