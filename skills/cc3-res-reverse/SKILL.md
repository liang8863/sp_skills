---
name: cc3-res-reverse
description: 'Use when the user explicitly writes @cc3 or @cc3_res with a local Cocos project and an explicit competitor http(s) URL. Require that URL before any project operation and record the supplied project metadata in the UI project at doc/project_info.md. Run the mandatory all-Prefab script-reference preflight first, repair proven script-caused missing references, and block later conversion or resource stages until the gate passes. Then inventory and normalize only the resource folder structure while preserving scenes, JS/TS, serialized content, UUIDs, class-ids, and bindings.'
---

# CC3 Resource Management

## Explicit Execution Contract

`@cc3` is a resource-folder-layout command with a mandatory pre-conversion Prefab gate. Execute exactly these operations:

- Derive `sjzbg` from `sjzbg_UI` and place all resource assets under `assets/resources/sjzbg_res/`.
- Move the contents of `assets/resources/` and the legacy `assets/prefabs/` resource directory into that root, preserving files and `.meta` sidecars.
- Keep `assets/scenes/` outside the resource root.
- Keep `assets/scripts/`, `assets/scripts_ts24/`, `assets/scripts_ts3/`, `assets/plugins/`, and `assets/import-materials/` unchanged.
- Run the Mandatory Pre-Conversion Prefab Gate before any resource normalization, script conversion, TS3 binding, or downstream project-creation stage. Do not continue while a blocking script-reference miss remains.
- Do not translate, generate, copy, rename, move, delete, or type-check JS/TS. Do not edit Prefab/Scene JSON, Resource JSON, `.meta` contents, UUIDs, class-ids, or script bindings except for the gate's evidence-backed restoration of an original missing script reference.

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

Do not perform TS3 conversion, JS-to-TS translation, general Prefab rebinding, gameplay changes, or any unrelated directory migration under `@cc3`. The gate may restore only an original script reference proven to be missing or invalid.

## Purpose

Inspect and organize resources in one supplied Cocos project. Treat scripts, serialized Prefab/Scene content, metadata content, and serialized references as read-only during inventory and normalization. Allow only the gate's minimal, evidence-backed repair of a script-caused missing reference; this skill does not translate or migrate scripts.

## Mandatory Pre-Conversion Prefab Gate

Run this gate as the first asset operation after the required-input and `project_info.md` metadata gates. The gate covers every `assets/**/*.prefab`, excluding `library/`, `temp/`, `build/`, and `node_modules/`.

1. Parse every Prefab structurally and inventory each script component: Prefab path, node path, component index, serialized `__type__` or UUID/class-id, resolved script path, `.meta` UUID, and status.
2. Resolve references through the available Cocos/MCP validation path. A text search is only a supplemental check. Detect literal `Missing Script`, empty or null `__type__`, missing script files, missing or mismatched `.meta` files, duplicate script UUIDs, unresolved compressed class-ids, parse/load errors, and imports that prevent the referenced component from loading.
3. Repair only a script-caused miss that has direct evidence from the existing script, `.meta`, Prefab binding, or Cocos-generated class registry. Preserve legacy JS and `.js.meta` UUIDs. Never invent UUIDs/class-ids, replace UUID text blindly, or convert JS to TS as a shortcut.
4. Re-run the complete all-Prefab scan after every repair. Require zero blocking script-reference misses and `missingCount: 0` for every available `validate_prefab_references` result before entering resource normalization or any later conversion/binding stage.
5. Treat unresolved, ambiguous, non-script, or runtime-only failures as blockers. Record the exact Prefab, component, evidence, attempted repair, and next action; do not continue with a partial gate. When runtime/MCP validation is unavailable, report the static gate as incomplete rather than claiming the repair is complete.

The gate may make the smallest evidence-backed repair to a script reference or its binding because a known missing script would invalidate all later stages. That exception does not permit general Prefab redesign, gameplay changes, JS-to-TS conversion, or speculative UUID changes.

## Scope And Required Inputs

When `@cc3` or `@cc3_res` is used, require a competitor URL supplied directly by the user. It must be an absolute `http://` or `https://` URL. Do not infer it from project files, history, search, or a similarly named game.

If the URL is absent, blank, a placeholder, or not an absolute HTTP(S) URL, stop before every project operation, including the Prefab gate, resource scan, filesystem change, and document output. Request: `請提供競品連結 URL（http:// 或 https://）。`

Treat the supplied project as the UI project for metadata output. After the URL gate and project-path resolution pass, create or update `doc/project_info.md` before the Prefab gate. It is the authoritative project-metadata file for later `@s-cli` resource-project lookup and must contain these exact Markdown keys:

```markdown
# Project Info

- `uiProjectPath`: `<absolute supplied project path>`
- `gameId`: `<derived game id>`
- `competitorUrl`: `<user-supplied absolute HTTP(S) URL>`
```

Preserve unrelated user-written content. Record additional notes only when the user explicitly supplies them; never add placeholders or inferred URLs. Do not access or scrape the competitor URL unless the user separately requests competitor analysis.

After the URL gate passes, resolve only the explicit local project path. If no path is supplied, use the current workspace only when it is a Cocos project; otherwise request a path.

Stay inside that project. Exclude generated `library/`, `temp/`, `build/`, and `node_modules/` from all scans and reports. Preserve unrelated dirty and untracked files.

## Absolute Prohibitions

- Do not translate, copy, generate, rename, delete, edit, type-check, or otherwise migrate JavaScript or TypeScript scripts.
- Do not create `scripts_ts24`, `scripts_ts3`, `scripts_<game>_UI`, migration records, compatibility layers, or script conversion reports.
- Do not edit `assets/scripts`, script `.meta` files, Prefab, Scene, Resource JSON, UUID, compressed class-id, `__type__`, `__uuid__`, `fileId`, `targetOverrides`, or any script-component binding except for the evidence-backed script-miss repair allowed by the Mandatory Pre-Conversion Prefab Gate.
- Do not rebind a Prefab/Scene component from JS to TS or from one script to another during the gate. Restore only the original script reference when the serialized binding is proven missing or invalid.
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

1. Record the project path and baseline with `git status --short --untracked-files=all`, then create or update `doc/project_info.md` with the required metadata keys.
2. Run the Mandatory Pre-Conversion Prefab Gate across every Prefab.
3. Repair only proven script-caused misses, then repeat the complete gate. Stop if any blocking result remains.
4. Inventory asset files and `.meta` pairs under `assets/`, excluding generated directories.
5. Parse Prefab, Scene, and resource JSON structurally to validate references. Never mutate serialized data outside the gate's evidence-backed script-miss repair.
6. Identify missing files, orphan candidates, duplicate candidates, stale locale variants, and resource categories from actual references. Mark uncertain purpose as `unknown` or `unverified`.
7. Apply the Default Directory Normalization after both the Prefab gate and path-reference gate pass. The only automatic moves are the contents of `assets/resources/` and the legacy `assets/prefabs/` resource directory; scenes, scripts, plugins, import materials, and all other directories stay in place.
8. Run `git diff --check` and report the exact checks, gate result, moved files, unresolved references, and remaining risks.

## Required Documents

For a completed resource-management run, create or update these Chinese documents under `doc/`:

- `doc/project_info.md`: authoritative UI-project metadata with the exact `uiProjectPath`, `gameId`, and `competitorUrl` keys.
- `doc/<project>-resource-inventory.md`: every Prefab row, resource categories, reference evidence, missing/orphan/duplicate findings, and verification status.
- `doc/<project>-operation-flow.md`: Mermaid startup and normal Spin/reel flow derived read-only from existing scripts, Prefabs, and verified call sites. Label it static analysis when runtime evidence is unavailable.

The documents must not claim JS-to-TS conversion, TS3 binding, or runtime verification unless separately proven outside this skill.

## Validation

Before reporting completion, verify:

```powershell
Test-Path "doc/project_info.md"
Test-Path "doc/<project>-resource-inventory.md"
Test-Path "doc/<project>-operation-flow.md"
Test-Path "assets/resources/<game>_res"
Get-ChildItem assets/resources -Force
Get-ChildItem assets -Recurse -File -Filter *.prefab | Measure-Object
rg -n 'Missing Script|missing script|"__type__"\s*:\s*""|"__type__"\s*:\s*null' assets --glob '*.prefab'
git diff --check
```

Also run the available `validate_prefab_references` or equivalent structural validator for every Prefab. A successful run requires zero blocking script-reference misses, zero unresolved script components, and a recorded before/after result for every repair. Do not treat a clean text search alone as proof that the Prefab class binding resolves.

## Completion Report

State the resolved UI project path, `doc/project_info.md` metadata keys, derived `<game>`, Prefab-gate counts and repair results, resource-root source and destination paths, legacy Prefab move, inventory counts, path-reference gate result, document paths, commands run, and untouched boundaries. Explicitly confirm that later stages were blocked until the all-Prefab script gate passed, and list any runtime/MCP verification limitation.
