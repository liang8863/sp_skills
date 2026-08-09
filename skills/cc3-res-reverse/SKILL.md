---
name: cc3-res-reverse
description: 'Use when the user explicitly writes @cc3 or @cc3_res with a local Cocos project. Inventory and normalize only the resource folder structure into the derived game resource directory while leaving scenes, JS/TS, serialized content, UUIDs, class-ids, and bindings untouched. Never translate JS to TS.'
---

# CC3 Resource Management

## Explicit Execution Contract

`@cc3` is a resource-folder-layout command only. Execute exactly these operations:

- Derive `sjzbg` from `sjzbg_UI` and place all resource assets under `assets/resources/sjzbg_res/`.
- Move the contents of `assets/resources/` and the legacy `assets/prefabs/` resource directory into that root, preserving files and `.meta` sidecars.
- Keep `assets/scenes/` outside the resource root.
- Keep `assets/scripts/`, `assets/scripts_ts24/`, `assets/scripts_ts3/`, `assets/plugins/`, and `assets/import-materials/` unchanged.
- Do not translate, generate, copy, rename, move, delete, or type-check JS/TS. Do not edit Prefab/Scene JSON, Resource JSON, `.meta` contents, UUIDs, class-ids, or script bindings.

The expected layout after a successful run is:

```text
assets/
  scenes/
  scripts/
  scripts_ts24/
  scripts_ts3/
  resources/
    sjzbg_res/
      <all non-scene resource folders and files>
```

Do not perform TS3 conversion, JS-to-TS translation, Prefab rebinding, gameplay changes, or any unrelated directory migration under `@cc3`.

## Purpose

Inspect and organize resources in one supplied Cocos project. Treat scripts, serialized Prefab/Scene content, metadata content, and serialized references as read-only evidence. Apply only the deterministic resource-directory normalization below; this skill does not translate or migrate scripts.

## Scope And Input

When `@cc3` or `@cc3_res` is used, resolve only the explicit local project path. If no path is supplied, use the current workspace only when it is a Cocos project; otherwise request a path.

Stay inside that project. Exclude generated `library/`, `temp/`, `build/`, and `node_modules/` from all scans and reports. Preserve unrelated dirty and untracked files.

## Absolute Prohibitions

- Do not translate, copy, generate, rename, delete, edit, type-check, or otherwise migrate JavaScript or TypeScript scripts.
- Do not create `scripts_ts24`, `scripts_ts3`, `scripts_<game>_UI`, migration records, compatibility layers, or script conversion reports.
- Do not edit `assets/scripts`, script `.meta` files, Prefab, Scene, Resource JSON, UUID, compressed class-id, `__type__`, `__uuid__`, `fileId`, `targetOverrides`, or any script-component binding.
- Do not rebind a Prefab/Scene component from JS to TS or from one script to another, even when a matching TS file exists.
- Do not infer, locate, or run missing decompiler tools, scrape runtime URLs, copy files from sibling projects, or change gameplay/protocol logic.

If an operation needs any prohibited edit, stop that operation, record the blocking path, and require a separate migration task.

## Default Directory Normalization

Run this normalization during every `@cc3` invocation. Do not wait for the user to repeat a folder-move request.

1. Derive `<game>` from the project directory: remove a trailing `_UI` case-insensitively, then lowercase it. Example: `sjzbg_UI` becomes `sjzbg`.
2. Treat `assets/resources/` as the resource root. Create or reuse:

   ```text
   assets/resources/<game>_res/
   ```

3. Move every direct child of `assets/resources/` into `assets/resources/<game>_res/`, including directories, files, nested files, and their `.meta` sidecars. Do not move the destination directory or its own `.meta` sidecar. This places all resource assets under one game resource root.
4. Also move the legacy `assets/prefabs/` directory and its folder `.meta` into `assets/resources/<game>_res/prefabs/` when present. If an empty destination placeholder already exists, retain the source resource files and replace only that empty placeholder with the source directory metadata; never overwrite a non-empty destination with different content.
5. Preserve every moved file byte-for-byte and preserve each source `.meta` UUID. Never edit serialized `__uuid__`, `__type__`, `fileId`, or binding data to force the move.
6. Before moving, scan JS/TS, configuration, and serialized resource data for path-string references to `assets/resources/` or `assets/prefabs/`. A serialized UUID reference is safe to preserve. A path-string reference is a blocker because this skill must not edit that file; report it and leave the affected source entry in place.
7. Keep `assets/scenes/` outside the resource root. Do not move or rename `assets/scripts`, `assets/scripts_ts24`, `assets/scripts_ts3`, `assets/plugins`, `assets/import-materials`, or any JS/TS file or directory. These are outside resource normalization.
8. Do not rename or move any other directory by default. Report it as `unknown` until a deterministic naming rule is added to this skill.
9. A successful run must leave `assets/resources/` with only `<game>_res/` and its folder `.meta` at the direct-child level. The legacy `assets/prefabs/` source must have no resource files or `.meta`; remove an empty untracked source directory when the filesystem permits, otherwise report it as a harmless empty residue.

## Workflow

1. Record the project path and baseline with `git status --short --untracked-files=all`.
2. Inventory asset files and `.meta` pairs under `assets/`, excluding generated directories.
3. Parse Prefab, Scene, and resource JSON structurally to validate references. Never mutate serialized data while validating it.
4. Identify missing files, orphan candidates, duplicate candidates, stale locale variants, and resource categories from actual references. Mark uncertain purpose as `unknown` or `unverified`.
5. Apply the Default Directory Normalization after its path-reference gate passes. The only automatic moves are the contents of `assets/resources/` and the legacy `assets/prefabs/` resource directory; scenes, scripts, plugins, import materials, and all other directories stay in place.
6. Run `git diff --check` and report the exact checks, moved files, unresolved references, and remaining risks.

## Required Documents

For a completed resource-management run, create or update these Chinese documents under `doc/`:

- `doc/<project>-resource-inventory.md`: every Prefab row, resource categories, reference evidence, missing/orphan/duplicate findings, and verification status.
- `doc/<project>-operation-flow.md`: Mermaid startup and normal Spin/reel flow derived read-only from existing scripts, Prefabs, and verified call sites. Label it static analysis when runtime evidence is unavailable.

The documents must not claim JS-to-TS conversion, TS3 binding, or runtime verification unless separately proven outside this skill.

## Validation

Before reporting completion, verify:

```powershell
Test-Path "doc/<project>-resource-inventory.md"
Test-Path "doc/<project>-operation-flow.md"
Test-Path "assets/resources/<game>_res"
Get-ChildItem assets/resources -Force
Get-ChildItem assets -Recurse -File -Filter *.prefab | Measure-Object
rg -n 'Missing Script|missing script|"__type__"\s*:\s*""|"__type__"\s*:\s*null' assets --glob '*.prefab'
git diff --check
```

The script-reference scan is read-only evidence only. Report findings; never repair bindings under `@cc3`.

## Completion Report

State the resolved project path, derived `<game>`, resource-root source and destination paths, legacy Prefab move, inventory counts, path-reference gate result, document paths, commands run, and untouched boundaries. Explicitly confirm that `assets/scenes`, JS/TS source, and Prefab/Scene script bindings were not changed.
