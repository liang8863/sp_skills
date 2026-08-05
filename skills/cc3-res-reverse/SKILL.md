---
name: cc3-res-reverse
description: 'Use when the user explicitly writes @cc3 or @cc3_res or asks to reverse-engineer and organize a PG/Cocos competitor project that has already been processed by an external decompiler and resource-upgrade tool. Read the local pg-reverse-toolkit guides, convert the supplied project from compiled JS to Cocos 2.4 TS and then Cocos 3.8.7 TS, repair SlotItem/reel integration, preserve resource binding boundaries, write the reel call logic, sequence diagrams, and a complete resource/prefab inventory under doc after translation, finalize the translated script/resource layout, and complete final script UUID/class-id integration with evidence. Do not use this skill to invent, locate, or run missing decompiler tools, scrape a runtime URL, or reverse-engineer a project without a local processed input directory.'
---

# CC3 Resource Reverse

## Purpose

Process a supplied, already decompiled and resource-upgraded PG/Cocos project into a maintainable Cocos Creator 3.8.7 project. Treat the original compiled JS and upgraded resources as evidence. Preserve behavior first; make no speculative gameplay rewrite.

The authoritative workflow is local:

```text
E:\CCCCCC\slot-fe-client\pg-reverse-toolkit
```

Read these files before the matching phase:

- `readme.md`: overall PG workflow, SlotItem warning, shared code and external-tool boundary.
- `JS_TO_COCOS24_TS_REVERSE_GUIDE.md`: JS -> Cocos 2.4 TS.
- `cocos24_to_cocos387_reverse_guide.md`: Cocos 2.4 TS -> Cocos 3.8.7 TS and final binding.
- `JS_TO_COCOS24_TS_IGNORE_MODULES.txt`: sole authority for first-pass ignored modules.
- `shared/`: already translated slot/util code; inspect the relevant file before creating a replacement.

## Trigger And Input

When the user writes `@cc3` or `@cc3_res`, resolve the input project in this order:

1. Use the explicit path following `@cc3_res`.
2. Otherwise use the current workspace only if it contains the expected Cocos assets.
3. If no path can be resolved, ask for one local directory path. Do not infer a path from a competitor URL.

The expected input is a local project produced by the external decompiler and resource-upgrade tool. It should contain most of:

```text
<input-project>/assets/scripts/*.js
<input-project>/assets/{prefabs,scenes,resources,...}
<input-project>/project.json or settings/ or an equivalent Cocos project marker
```

Reject or pause when only an H5 URL, HTML shell, CDN page, or screenshot is supplied. A runtime URL is not the input accepted by this skill. Process only material the user is authorized to inspect.

## Project Boundary

Treat the resolved input directory as the write boundary for every invocation:

- Read the toolkit at `E:\CCCCCC\slot-fe-client\pg-reverse-toolkit`, but never modify it.
- Do not write to a sibling game, the repository root, another project, or any path outside the resolved input directory.
- Keep generated migration records, intermediate TS, reports, backups, and resource changes inside the input directory.
- Preserve unrelated dirty and untracked files inside the input project.
- Before any write, print the resolved absolute target path and verify it is under the input directory.

## Non-Negotiable Boundaries

- Do not invent executable names, CLI arguments, or output from the missing decompiler/resource-upgrader tools. This skill consumes their output; it does not replace them.
- Keep `assets/scripts` as the original JS comparison source during the first two phases.
- Do not modify original JS, `.js.meta`, UUIDs, Prefab, Scene, Resource, or other binding files during JS -> TS24 and TS24 -> TS3 static migration.
- Do not use `any`, broad `Function`, fake Cocos shims, guessed DTOs, guessed UUIDs, or a compatibility layer that hides Cocos 2 behavior.
- Do not infer protocol or gameplay semantics from shared artwork. Trace JS calls, data flow, resources, and runtime behavior separately.
- Do not declare completion from parse success alone. Record checks, unresolved boundaries, and runtime limitations.

## Workflow

### 1. Preflight And Baseline

Run from the input project root:

```powershell
$inputRoot = (Get-Location).Path
git status --short --untracked-files=all
Test-Path assets/scripts
Get-ChildItem assets/scripts -Filter *.js | Measure-Object
Get-ChildItem assets -Recurse -Include *.prefab,*.scene,*.fire,*.json -File |
  Select-Object -First 20 FullName
```

Confirm the project version and shape before editing. If there is no Git repository, report that the required local baseline is missing and ask whether to run `git init`; do not silently create a history boundary in an unknown project. Never stage generated `library/`, `temp/`, `build/`, or `node_modules/` content.

Create or update only these migration records inside the input project:

```text
assets/scripts_ts24/_dependency_order.txt
assets/scripts_ts24/TS_REVERSE_PROGRESS.md
assets/scripts_ts3/TS3_MIGRATION_PROGRESS.md
```

If these directories already exist, compare them first and preserve useful work. Do not delete or overwrite them wholesale.

Read the ignore list from the toolkit, not from memory or an ad hoc copy. Exclude those module names from JS/TS completeness counts. Keep ignored modules as original JS/CommonJS boundaries or use `InstanceType<typeof Module.default>`; do not retranslate them or treat them as missing business scripts.

### 2. Build The JS Dependency Order

Scan non-ignored `assets/scripts/*.js` for `require(...)`, exports, prototype assignments, `Object.defineProperty`, Cocos decorators, lifecycle methods, event registration, schedules, resource loading, and spin/result/bonus references.

Write `_dependency_order.txt` in this order:

1. Constants, enums, and pure utilities.
2. Data models, configuration, and repositories.
3. Framework and helpers.
4. UI controllers.
5. Slot controllers and state machines.
6. Main entry points.

Record cycles instead of breaking them mechanically. Keep CommonJS where changing import shape would change runtime initialization order.

### 3. Restore JS To Cocos 2.4 TS

Create one same-name TS file under `assets/scripts_ts24` for every non-ignored business JS file. For each file, compare the original JS, all call sites, serialized property names, and prototype body before editing.

Restore the structure without changing behavior:

- Remove `cc._RF.push/pop` wrappers.
- Restore `cc.Component`, `cc._decorator`, `@ccclass`, and `@property(...)`.
- Restore default/named/CommonJS exports according to actual callers.
- Restore getters/setters from `Object.defineProperty`.
- Account for every prototype method, string method name, and override.
- Restore semantic names only when supported by context; do not globally replace short names.
- Infer fields, parameters, and return types from decorators, initialization, constructors, call sites, assignment flow, and return branches.
- Preserve Cocos 2.4 `node` properties, Action APIs, schedule order, event targets, callbacks, and slot state-machine timing.
- Use a narrow named boundary type for real dynamic payloads; do not widen recoverable types to `unknown` or `any`.

Replace references to ignored modules with the original module boundary or the toolkit's existing shared implementation. Do not duplicate shared slot/util classes in business files.

After each understandable batch, update `TS_REVERSE_PROGRESS.md` with the source files, dependency batch, temporary boundaries, risks, and commands run.

### 4. Close The TS24 Static Stage

Run the same checks after all non-ignored scripts are restored:

```powershell
Get-ChildItem assets/scripts_ts24 -Filter *.ts | Measure-Object
rg -n 'RuntimeValue|\bRuntime\b|\bLike\b|\bCompat\b|\bFacade\b|\bPlaceholder\b|\bany\b|\bFunction\b' assets/scripts_ts24 --glob '*.ts'
git diff --check
```

Use the Babel parser check from `JS_TO_COCOS24_TS_REVERSE_GUIDE.md` with a PowerShell here-string (`@' ... '@ | node`), not Bash `node - <<'NODE'`. Also check:

- non-ignored JS/TS name parity;
- export shape and prototype parity;
- getter/setter and decorator fields;
- same `on/off` function reference, target, and capture arguments;
- same `schedule/unschedule`, callback cancellation, and action order;
- member access modifiers against callers and inheritance.

Classify every hit as `must fix`, `false positive`, or `allowed boundary`, and record the latter two. Do not enter Cocos 3 API migration until real TS24 blockers are closed.

### 5. Migrate TS24 To Cocos 3.8.7 TS

Copy the structure into `assets/scripts_ts3`; never use `assets/scripts_ts24` as the edit target:

```powershell
New-Item -ItemType Directory -Force assets/scripts_ts3 | Out-Null
Copy-Item assets/scripts_ts24\*.ts assets/scripts_ts3\ -Force
```

Apply the guide's migration order:

1. Import `_decorator`, `Component`, `Node`, and other engine types from `cc`; remove real `legacyCC` usage.
2. Preserve serialized field names; type every `@property`; retain required `_N$...` bridge fields.
3. Convert Node position, size, opacity, color, angle, parent, and coordinate-space operations to the correct Cocos 3 component/API.
4. Convert Action chains to Tween chains while preserving duration, easing, target object, callback order, and cancellation. Reuse an existing project helper or toolkit `shared/util` helper.
5. Move cleanup to `onDestroy()`; do not override `Component.destroy()`; preserve event and schedule unregistration identity.
6. Replace local string component lookup with imported class lookup. Convert 2D `cc.ParticleSystem` to `ParticleSystem2D`.
7. Keep only proven Cocos private bridges for Button, Slider, ScrollView, or ListView; isolate magic names and document why they remain.
8. Converge DTOs to real migrated classes or role-named boundary interfaces. Remove recoverable `any`, broad `Function`, and temporary `Like/Compat/Facade` names.
9. Run formatting last; do not change declaration order, property names, exports, or behavior during formatting.

Do not modify resources or script bindings in this stage. A Cocos 3 TS file in `assets/scripts_ts3` is not a formally bound project script yet.

### 6.5 Mandatory Translation Documentation And Final Gate

After the JS -> TS24 -> TS3 translation reaches its stated static/runtime stopping point, create or update one Chinese Markdown document under the resolved project's `doc/` directory. Use a stable project-specific name such as `doc/<project>-operation-flow.md`; preserve an existing document and update it instead of creating duplicates.

Derive the document from the original JS, translated TS, resource structure, and verified call sites. Do not invent behavior from artwork or generic slot assumptions. Include, at minimum:

- a Mermaid startup/preload sequence diagram;
- a Mermaid normal Spin sequence from input, state transition, API request, transaction data update, reel start/stop, result rendering, Prize/settlement, and return to idle;
- the reel/board call logic, including `SlotHandler` or the project equivalent, reel creation/pooling, start/stop order, fast stop, per-reel callbacks, result data injection, cascade/drop or respin branches, and completion callbacks;
- Free Spin, Respin, bonus, and settlement branches when present;
- external framework/API/CommonJS boundaries and any unresolved timing assumptions;
- source-file evidence paths and a clear statement of whether the document describes static translation only or runtime-verified behavior.

Treat this document as a required delivery artifact, not an optional summary. Validate that `doc/` exists, the document contains both the sequence diagrams and reel call logic, and `git diff --check` passes before reporting the translation stage complete.

After translation is complete, do not report completion until `doc/<project>-operation-flow.md` has been written or updated. The final document must contain the translated project's reel invocation logic and Mermaid sequence diagrams; static-only evidence is acceptable only when it is labeled as such, with runtime verification limits and unresolved timing assumptions recorded.

Apply the following final acceptance standard and repair any failure before completion:

1. **Prefab script references must not be missing.** Scan every `*.prefab` under `assets/` for custom script components. Resolve each script-component `__type__` through the current Cocos 3 `.meta` UUID/class-id mapping and confirm that no component is represented by a Missing Script, empty/invalid `__type__`, unresolved UUID, or stale JS binding. When a reference is missing, repair the script/meta/class-id or Prefab binding, re-import the project, and run the scan again. A nonzero missing-script result is a failed translation gate, not a report-only warning.

Record the scan command, total Prefabs, checked script components, repaired references, unresolved references, and final missing count in `doc/<project>-resource-inventory.md` and the completion report. Keep ordinary asset `__uuid__` references unchanged while repairing script-component bindings.

Run the final documentation gate:

```powershell
Test-Path "doc/<project>-operation-flow.md"
rg -n "sequenceDiagram|reel|SlotHandler|start|stop|callback" "doc/<project>-operation-flow.md"
git diff --check
```

Run the Prefab script-reference gate as part of the final checks:

```powershell
Get-ChildItem assets -Recurse -File -Filter *.prefab | Measure-Object
rg -n 'Missing Script|missing script|"__type__"\s*:\s*""|"__type__"\s*:\s*null' assets --glob '*.prefab'
git diff --check
```

Treat the textual scan as a minimum check. Confirm UUID/class-id resolution against the current Cocos import database or editor output; do not declare the gate passed from the absence of the literal words `Missing Script` alone.

### 6.6 Mandatory Resource And Prefab Inventory

After resource analysis and before the final completion report, create or update a separate Chinese Markdown document:

```text
doc/<project>-resource-inventory.md
```

Build the inventory from actual files and verified references. Cover every resource file under the project asset roots that exists in the supplied project, at least `assets/prefabs`, `assets/scenes`, `assets/resources`, `assets/audio`, `assets/animations`, `assets/spine`, `assets/atlas`, `assets/textures`, `assets/materials`, `assets/effects`, and `assets/shaders` when present. Record relative path, resource type, UUID/meta status, direct dependencies, known callers or scene/prefab mounts, and verification status. Do not infer a resource's purpose from its filename alone; use prefab/scene structure, attached script types, serialized properties, code call sites, and resource references as evidence. Mark purpose as `unknown` or `unverified` when evidence is insufficient.

Include a prefab quick-reference table containing one row for every `*.prefab` in the input project. Use these columns at minimum:

```text
Prefab | Relative path | Root/important nodes | Attached scripts/components | Used by | Purpose | Evidence | Verification
```

Explain what each prefab does in the `Purpose` column. Distinguish UI, reel/SlotItem, symbol/effect, loading, popup, bonus/free-game, audio, and shared/template prefabs where evidence supports the classification. List unreferenced or orphan candidates separately; do not silently omit them. Keep exact file paths in evidence so another agent can open the source and confirm the description.

Validate the document before completion:

```powershell
Test-Path "doc/<project>-resource-inventory.md"
Get-ChildItem assets -Recurse -File -Filter *.prefab | Measure-Object
rg -n "Prefab \| Relative path \|.*Purpose|Verification|unknown|unverified" "doc/<project>-resource-inventory.md"
git diff --check
```

The counted prefab files and the quick-reference rows must match, except for an explicitly documented generated/vendor exclusion. Treat missing rows, filename-only descriptions, or undocumented unreferenced prefabs as incomplete delivery.

The resource inventory must also contain these two logic modules, even when their implementation is spread across multiple Prefab, Scene, TypeScript, JavaScript, Animation, Spine, or effect files:

1. **消除特效用到的预制体逻辑**: identify the trigger entry, symbol/reel state that starts it, participating Prefabs and important nodes, attached controllers, animation/effect resources, pooling or reuse path, hide/destroy cleanup, and the callback that releases the reel/result flow. Trace the actual call chain from the original JS and translated TS; distinguish ordinary symbol removal from win-clear, cascade, or special-symbol effects when the project has separate branches.
2. **掉落咪牌特效逻辑**: preserve this project term and list any source aliases found in code or resources. Identify the drop/咪牌 trigger condition, reel or column position calculation, Prefab and child effect nodes, animation/Spine/particle resources, sequencing with reel stop or drop completion, interruption/fast-stop handling, cleanup/reuse, and downstream callback. Mark the behavior as static-only when no runtime or deterministic replay evidence exists.

Add a dedicated subsection for each module to `doc/<project>-resource-inventory.md` with an evidence table using at least:

```text
Module | Trigger/entry | Prefab/resource | Script call chain | Lifecycle/callback | Verification
```

Do not describe either module from artwork or a filename alone. Record `unknown`, `unverified`, or `not present` explicitly when the project lacks a branch or the evidence is incomplete.

### 6.7 Mandatory Post-Translation Layout And Commit Gate

Run this organization step only after translation, binding, Prefab-reference validation, and the two required `doc/` reports are complete. Keep all moves, deletes, and binding updates inside the resolved input project.

1. Derive `<game>` from the actual game short name. In the user's notation, the script `<name>` is `<game>_UI`; therefore a game named `ryxc` produces `assets/scripts_ryxc_UI`. Before renaming, confirm that every Prefab and Scene script component resolves to `assets/scripts_ts3` and that no active reference resolves to `scripts_ts24` or `scripts`.
2. Rename `assets/scripts_ts3` to `assets/scripts_<game>_UI` (equivalent to `assets/scripts_<name>` where `<name>` is `<game>_UI`). Update only script-component bindings and matching `.meta` paths through structured project data; do not alter ordinary asset UUID references.
3. Delete `assets/scripts_ts24` and `assets/scripts`, including their corresponding `.meta` files, only after the final renamed script directory is verified and all Prefab/Scene references resolve to it. Do not leave stale copies, compatibility directories, or duplicate active scripts.
4. Keep `assets/resources` as the resource root and create the final bundle at `assets/resources/<game>_res/` (equivalent to `resources/<name>_res` using the game name). Move the existing contents of `assets/resources` into that bundle, then move `assets/prefabs` to `assets/resources/<game>_res/prefabs`. The final structure must not contain a top-level `assets/prefabs` or a self-nested `assets/resources/resources` directory.
5. Re-scan Prefab/Scene references and resource paths after every move. Resolve references from parsed JSON/YAML and current `.meta` data; do not repair paths with blind global text replacement. Re-run the Missing Script gate and require zero unresolved script references.
6. Run `git diff --check` and `git status --short --untracked-files=all`. Stage only the resolved input project's intended translation, binding, documentation, and layout files; never stage `library/`, `temp/`, `build/`, `node_modules/`, or unrelated dirty work. After all gates pass, create exactly one Git commit for the completed translation layout and record the commit hash in the completion report. Do not create the commit when any gate fails.

Validate the final layout before reporting completion:

```powershell
Test-Path "assets/scripts_<game>_UI"
Test-Path "assets/resources/<game>_res/prefabs"
Test-Path "assets/scripts_ts24"
Test-Path "assets/scripts"
Get-ChildItem assets -Recurse -File -Include *.prefab,*.scene,*.fire |
  Select-String -Pattern 'scripts_ts24|scripts_' -SimpleMatch
git diff --check
```

The first two paths must exist, the third and fourth must be absent, and the reference scan must show only the final `scripts_<game>_UI` binding. Replace `<game>` with the resolved game name in the actual commands and completion report.

### 6. Handle SlotItem And Reel Logic Manually

Treat the board as the highest-risk area. PG games may build SlotItems from Prefabs or from code, and their reel/state-machine coupling differs by game.

Before changing board code:

1. Trace symbol creation, pooling, destruction, blur/normal state, result value, stop bounce, replacement, and cascade/drop transitions in the original JS.
2. Read the relevant Prefab/Scene structure without editing it.
3. Inspect and reuse the applicable toolkit classes: `SlotReelMgrViewBase`, `SlotReelViewBase`, `SlotItemBase`, `SlotItemPool`, and `PopOut*Base`.
4. Adapt the project's own symbol mapping and transaction/result models instead of copying a sibling game's assumptions.
5. Verify reel coordinates, symbol dimensions, stop order, blur transitions, and callback completion against real responses or recordings.

Do not call SlotItem work complete because TS parsing or class construction succeeds. Keep its unresolved assumptions in the progress record.

### 7. Static TS3 Gate

Run the frozen checks from the Cocos 3 guide:

```powershell
rg -n 'cc\.|legacyCC|cc\[|cc\._decorator' assets/scripts_ts3 --glob '*.ts'
rg -n 'runAction|stopAllActions|cc\.sequence|cc\.spawn|cc\.callFunc|cc\.delayTime|cc\.targetedAction' assets/scripts_ts3 --glob '*.ts'
rg -n 'getComponent\(' assets/scripts_ts3 --glob '*.ts'
rg -n 'addComponent\(' assets/scripts_ts3 --glob '*.ts'
rg -n 'macro\.KEY|\bmacro\b|\b(any|Function)\b' assets/scripts_ts3 --glob '*.ts'
rg -n 'ParticleSystem|this\.node\.destroy\(' assets/scripts_ts3 --glob '*.ts'
npx prettier --check 'assets/scripts_ts3/**/*.ts'
git diff --check
```

Use the Babel parse check from the guide against `assets/scripts_ts3`. Inspect Node-property scan false positives one by one. Require non-ignored TS24/TS3 parity, no real old API residue, explicit property types, no broad types, and documented allowed boundaries before final binding.

### 8. Final Script And Resource Binding

Perform this stage only after the static TS3 gate passes and only when the user requests a formally integrated project. Keep every write inside the resolved input directory:

1. Replace each formal `assets/scripts/Foo.js` with final `Foo.ts`; do not keep both as active same-component scripts.
2. Convert `Foo.js.meta` to the Cocos 3 TS meta while preserving the original script UUID.
3. Let the current Cocos 3 editor generate class ids. Use `EditorExtends.UuidUtils.compressUuid(meta.uuid, false)` or current editor chunks; never guess.
4. Produce a mapping of script path, class name, full UUID, and compressed class id.
5. Run a dry-run report before writing resources: files, replacement count, mappings, unresolved UUIDs, ignored-module hits.
6. Replace only script-component `"__type__"` values in Prefab/Scene/Resource JSON. Do not alter ordinary `"__uuid__"` asset references.
7. Scan for remaining full-UUID script `__type__` values and open the project to check for Missing Script.

Do not combine this binding change with gameplay, animation, protocol, or resource redesign. If a UUID cannot be mapped from the current editor/project, stop and report it.

### 9. Runtime And Delivery Evidence

After binding, connect modules in this order as applicable: scene, infoboard, bigwin, totalwin, spin/result, reel stop, win, cascade/drop, bonus/free game, settlement, audio, and resource loading.

Use real responses or deterministic replay data to verify:

- initial scene and resource loading;
- one normal Spin through standby -> spinning -> stop;
- SlotItem creation, blur, stop, cascade/drop, and pooling;
- win display, multiplier, bonus/free-game transitions, and settlement;
- no blocking runtime error, Missing Script, stale event listener, or stuck tween.

Use Cocos MCP/runtime evidence when available. If runtime tooling is unavailable, report static evidence separately and state that runtime acceptance remains unverified.

## Completion Report

End each `@cc3` / `@cc3_res` run with:

- resolved input project and detected Cocos/resource shape;
- files and modules processed, ignored, or left as boundaries;
- TS24/TS3 counts and parse/static check results;
- SlotItem/reel assumptions and real-response evidence;
- resource files changed, UUID/class-id dry-run summary, and Missing Script result;
- runtime checks performed or explicitly unavailable;
- `doc/<project>-operation-flow.md` path and confirmation that it contains the verified sequence diagrams and reel call logic;
- `doc/<project>-resource-inventory.md` path, total resource counts, and confirmation that every prefab has a purpose row in the quick-reference table;
- confirmation that the resource inventory contains the `消除特效用到的预制体逻辑` and `掉落咪牌特效逻辑` subsections with call-chain evidence;
- final layout paths for `assets/scripts_<game>_UI` and `assets/resources/<game>_res`, confirmation that `assets/scripts_ts24`, `assets/scripts`, and top-level `assets/prefabs` are absent, and the single commit hash;
- final Prefab script-reference gate result, including checked count, repaired count, unresolved count, and `missing script = 0`;
- remaining blockers and exact next action.

Do not claim “完成” when only the source scripts were translated or when the page loads without a real Spin.
