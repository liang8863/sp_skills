---
name: create-slot
description: 'Use when the user explicitly writes @create_slot {addr} and asks to create a new slot-fe game project from an @cc3-translated Cocos project. Resolve the translated project, derive slot-fe-{name} from a {name}_UI directory, copy the sibling template safely, migrate the approved game resources and TS3 staging output, discard TS24 code, and record conflicts and binding work under doc.'
---

# Create Slot Project

## Purpose

Create a new Cocos Creator slot project from a project already translated by the `@cc3` / `@cc3_res` workflow. Use the `addr/../../template` directory as the project base, keep template shared code intact, migrate only verified game material, and leave a reproducible migration report.

Use the local toolkit as the primary migration authority:

```text
E:\CCCCCC\slot-fe-client\pg-reverse-toolkit
```

The upstream reference is:

```text
https://github.com/jp-sunshine/slot-fe-client/tree/main/pg-reverse-toolkit
```

When the remote reference is unavailable, continue from the checked-out local toolkit and report that the local copy was used.

## Trigger And Address Rules

Trigger only for an explicit command in this form:

```text
@create_slot {addr}
```

Resolve `{addr}` as a local absolute directory. Do not infer it from a URL, project nickname, current directory, or sibling game.

Derive paths exactly as follows:

```text
addr       = resolved translated project directory
parent     = addr/../..
template   = parent/template
sourceName = leaf directory name of addr
name       = sourceName with the final _UI suffix removed
target     = parent/slot-fe-{name}
```

Require the source leaf to match `^(?<name>.+)_UI$`. For example:

```text
E:\work\games\CC3Proj\ryxc_UI
  parent   = E:\work\games
  template = E:\work\games\template
  target   = E:\work\games\slot-fe-ryxc
```

Stop before writing when any of these conditions holds:

- `addr` does not exist or is not a directory;
- the leaf does not end in `_UI`;
- `addr/assets/scripts_ts3` is missing;
- `addr/../../template` is missing;
- `addr/../../slot-fe-{name}` already exists;
- the resolved target escapes `addr/../..` after path normalization.

## Project Boundary

Keep every write inside `addr/../..` and never modify the source `addr`. Preserve unrelated dirty and untracked work in both source and parent repositories. Do not initialize Git, add submodules, delete an existing target, or overwrite a conflicting file unless explicitly requested.

Before writing, print and verify:

```text
source:  <absolute addr>
parent:  <absolute addr/../..>
template: <absolute addr/../../template>
target:  <absolute addr/../../slot-fe-{name}>
```

Use `scripts/create_slot_project.ps1` for deterministic path validation, template creation, conflict checks, copying, and report generation.

## Source Acceptance

Treat the source as an `@cc3`-translated project only when it contains:

- `assets/scripts_ts3/` as the Cocos 3.8.7 script staging directory;
- `assets/scripts_ts24/` may exist as intermediate output; treat it as evidence only and discard it from the new project;
- the original `assets/scripts/*.js` and `.js.meta` comparison boundary;
- Cocos assets such as `assets/prefabs`, `assets/scenes`, `assets/resources`, or equivalent project asset folders;
- `doc/<project>-operation-flow.md` containing the verified sequence diagrams and reel/board call logic required by the `@cc3` skill.

Read `addr/progress.md`, `addr/task_plan.md`, `assets/scripts_ts3/TS3_MIGRATION_PROGRESS.md`, and the operation-flow document before selecting files. If `assets/scripts_ts24/` exists, record it as discarded; never use it as target code or as a formal binding input. Report missing records instead of silently treating an incomplete translation as complete.

## Creation Workflow

### 1. Preflight

Run from the resolved source project or pass `-Addr` to the helper:

```powershell
git -C $addr status --short --untracked-files=all
Test-Path (Join-Path $addr 'assets/scripts_ts3')
Test-Path (Join-Path (Split-Path (Split-Path $addr -Parent) -Parent) 'template')
Test-Path (Join-Path (Split-Path (Split-Path $addr -Parent) -Parent) ("slot-fe-$name"))
```

Record source file counts and the current source Git status. Do not clean the source to make the operation easier.

### 2. Create From Template

Copy the entire sibling `template` project into the new target, excluding generated/editor cache and repository directories:

```text
.git
library
temp
build
node_modules
```

Preserve all template project configuration, `.meta` files, shared bridge, common scripts, packages, extensions, and settings. Do not copy the source project over the template wholesale.

The template declares `assets/scripts/bridge` as a submodule. Verify that `Loader.ts`, `ServiceBridge.ts`, and `components/i18n/LanguageData.ts` exist in the target. If the template submodule is empty, use an initialized sibling bridge with the same submodule source, exclude its `.git` pointer, and record the bridge source and commit. Stop before creating the target when no usable bridge source exists.

Set the target project identity to `slot-fe-{name}` only in the template's structured project-name field when that field exists (`package.json`, `project.json`, or the current Cocos project marker). Do not perform a blind text replacement and do not change resource UUIDs.

When `assets/scenes/main.scene` is copied, use its `.meta` UUID as the target start scene in `buildConfig_web-mobile.json`, `profiles/v2/packages/builder.json`, and `profiles/v2/packages/web-mobile.json`, replacing the template `mjhlGame.scene` entry. Keep the editor instruction to open `main.scene` before preview. If the source scene contains JavaScript component UUIDs and the migrated TS3 scripts have matching basenames, replace only those scene `__type__` values with the exact TS3 `.meta` UUIDs; do not guess class IDs.

### 3. Migrate Game Resources

Copy these source trees when they exist, preserving relative paths and every accompanying `.meta` file:

```text
assets/prefabs
assets/scenes
assets/resources
assets/import-materials
assets/materials
assets/animations
assets/audio
assets/spine
assets/textures
assets/atlas
assets/effects
assets/shaders
```

Use the actual directories present in `addr`; do not create empty placeholder directories. These are game/resource candidates, not an instruction to copy generated caches.

For each destination file:

- copy when the destination path does not exist;
- skip when source and destination hashes are identical;
- stop and report a conflict when both files exist with different content;
- never overwrite template bridge, shared scripts, packages, or a conflicting resource automatically.

Use Cocos Creator export/import for UUID-sensitive Prefab, Material, Shader, Atlas, Spine, and Animation changes when the source and target are separate Cocos projects. Raw file copy is acceptable only for a same-project template copy with identical metadata semantics, and the report must say which method was used.

### 4. Migrate Translated Scripts As Staging Output

Copy the translated code into staging locations in the new project:

```text
addr/assets/scripts_ts3  -> target/assets/scripts_ts3
addr/doc                  -> target/doc
```

Do not copy `addr/assets/scripts_ts24/` into the target. TS24 code is discarded for this workflow; leave the source copy untouched and record its discarded status in the migration report. The target must not create `assets/scripts_ts24/`.

Do not copy `addr/assets/scripts/*.js` into the target's formal `assets/scripts` directory as an active Cocos 3 script set. Keep the original JS in the source project as the comparison boundary.

Keep the template's `assets/scripts/bridge` and shared framework implementation. If a translated script has the same path as a template script, classify it as one of:

- shared template implementation: retain the template file;
- game-specific implementation: stage it under `assets/scripts_ts3` and record the eventual formal replacement;
- content conflict: stop and require explicit resolution.

Do not copy ignored modules as new business translations. Use the ignore list from the local toolkit and keep those modules as the original JS/CommonJS or shared implementation boundary.

### 5. Formal Binding Is A Separate Gate

Treat the new project as staged until all of the following are available:

1. Cocos 3 editor import/compile has registered the translated TS classes.
2. Each final TS script has a `.meta` with the correct script UUID policy.
3. The current Cocos project has generated the compressed class id for each script.
4. A dry-run maps only script-component `__type__` values in Prefab/Scene/Resource JSON.
5. Ordinary asset `__uuid__` references are unchanged.

Never guess a class id, replace a full UUID with a hand-written value, or modify ordinary asset `__uuid__` references. For this startup workflow, the helper may replace only exact source JavaScript `.meta` UUIDs with matching TS3 `.meta` UUIDs in migrated Scene/Prefab `__type__` fields; Cocos import/compile and runtime verification remain separate gates.

## Mandatory Migration Report

Create or update this file in the new project:

```text
target/doc/create-slot-migration.md
```

Record:

- source, parent, template, target, and derived `{name}`;
- source/target Cocos version and project markers;
- copied resource roots and skipped generated roots;
- bridge source, submodule commit, and required entry files;
- selected start scene and updated builder configuration;
- copied `scripts_ts3` status and discarded `scripts_ts24` status;
- source JS and `.meta` preservation status;
- identical-file skips and content conflicts;
- whether Cocos export/import or raw copy was used;
- formal script/class-id binding status and unresolved mappings;
- the source operation-flow document path;
- exact validation commands and results;
- next action if the target is still staging-only.

Keep the report factual. Distinguish “copied”, “staged”, “formally bound”, and “runtime verified”.

## Validation

Run these checks before completion:

```powershell
Test-Path $target
Test-Path (Join-Path $target 'assets/scripts_ts3')
(-not (Test-Path (Join-Path $target 'assets/scripts_ts24')))
Test-Path (Join-Path $target 'assets/scripts/bridge/Loader.ts')
Test-Path (Join-Path $target 'assets/scripts/bridge/ServiceBridge.ts')
Test-Path (Join-Path $target 'assets/scripts/bridge/components/i18n/LanguageData.ts')
Test-Path (Join-Path $target 'profiles/v2/packages/web-mobile.json')
Test-Path (Join-Path $target 'doc/create-slot-migration.md')
Get-ChildItem $target/assets/scripts_ts3 -Filter *.ts | Measure-Object
git -C $addr diff --name-only -- assets/scripts
git -C $addr diff --name-only -- '*.meta'
git diff --check
```

Also verify:

- the target leaf name is exactly `slot-fe-{name}`;
- template files excluded from the copy are absent or freshly generated as expected;
- no source file changed;
- no target conflict was silently overwritten;
- all configured start-scene entries point to `assets/scenes/main.scene` and its `.meta` UUID;
- no migrated Scene/Prefab contains a source JavaScript script UUID when an exact TS3 `.meta` match exists;
- `doc/create-slot-migration.md` exists and names the migrated resources;
- the source `doc/<project>-operation-flow.md` remains available in the target evidence copy;
- runtime acceptance is explicitly marked unverified until Cocos Editor/MCP proves a real Spin.

## Completion Report

End each `@create_slot` run with:

- resolved source/template/target paths and derived name;
- target creation result;
- bridge source and start scene result;
- resource roots copied, skipped, or blocked;
- translated script staging result;
- TS24 discard result;
- conflict and UUID/class-id dry-run result;
- `target/doc/create-slot-migration.md` path;
- validation results and runtime status;
- exact remaining blocker and next action.

Do not claim the new project is runtime-ready because template copy, parser success, or a reachable Cocos project alone succeeded.
