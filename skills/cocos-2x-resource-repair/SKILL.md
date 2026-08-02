---
name: cocos-2x-resource-repair
description: Repair Cocos Creator 2.x resources after migration into Cocos Creator 3.x projects. Use when prefabs, scenes, .anim files, sprite atlas frames, legacy script UUIDs, blend/color animation tracks, or runtime visual parity differ between a 2.x resource project and a 3.x Slot FE game.
---

# Cocos 2.x Resource Repair

Use this skill for old Cocos Creator 2.x assets that have been copied or rebuilt into a 3.x project and no longer match the source game at runtime.

## Investigation First

1. Prove the active project path and Cocos version before editing. Use MCP `get_editor_state` / `get_project_info` when available.
2. Gather the runtime symptom: console stack, screenshot, target prefab/scene path, and the exact source 2.x asset path.
3. Inspect the migrated prefab or `.anim` JSON directly. Do not infer from the editor hierarchy alone.
4. Compare against the 2.x source resource by UUID, node name, component type, animation clip, and atlas frame name.
5. Make one targeted fix, then refresh assets and validate the touched prefab/runtime path.

## Script UUIDs

- Preserve `.meta` UUIDs unless there is a proven reason to change them.
- When porting a 2.x JavaScript component to 3.x TypeScript for a prefab that already serializes the old script id, keep the TypeScript `.meta` UUID aligned with the legacy script UUID.
- In Cocos 3.x prefab JSON, verify the component `__type__` resolves to the registered class. Runtime proof is stronger than a static search:
  - `cc.js.getClassByName("<legacy-uuid>")` should return a class.
  - `validate_prefab_references` for the target prefab should show `missingCount: 0`.

## Atlas And Animation Frames

- Old 2.x `.anim` sprite-frame references often look like `oldUuid@f9941`; Cocos 3.x sub-assets use new atlas UUID plus subMeta suffix.
- Do not map frames by array order unless there is no alternative. Prefer:
  1. Read old `.plist.meta` / texture meta to map `oldUuid -> frame name`.
  2. Read current 3.x atlas meta to map `frame name -> newUuid@subMeta`.
  3. Rewrite only the affected `.anim` / prefab references.
- After rewriting, search the touched assets for stale `@f9941` references.

## Color Tracks And Black Rectangles

Cocos 2.x effects sometimes used additive rendering where black tint meant visually transparent. After migration to Cocos 3.x normal Sprite rendering, the same animation can become black boxes.

Check `.anim` object tracks bound to `"color"` for packed values such as:

- `4278190080` (`0xff000000`, black)
- `4287137928` (`0xff888888`, grey)
- `4294967295` (`0xffffffff`, white)

For migrated VFX sprites that should glow or explode, do not leave the clip fading RGB to black unless the material/blend mode has also been restored. Prefer one of these targeted fixes:

- Keep the color track white and drive disappearance with `UIOpacity` tween/fade in the controlling 3.x script.
- Or rebuild the material/blend mode deliberately if the asset truly depends on additive blending.

Validate by checking the actual effect at runtime; static asset validation cannot prove the blend result.

## Material Mapping And Donor Prefab Sync

- When you repair a live prefab under `games/<game>/assets/resources/.../load_res/`, check whether the repo also keeps a same-name donor/reference prefab in a UI project and sync the material-binding change there too. Otherwise the donor prefab stops being a trustworthy reference source.
- If the donor/UI project is missing blend materials that the live prefab now depends on, add the material assets there first instead of leaving broken references or falling back to default sprite material.
- For hover/glow nodes, recover the blend mapping from legacy prefab logic or old controller behavior, not from visual guesswork alone.
- JDSRY `spin_button_controller.prefab` is the reference example:
  - `circle_hover` and `*_add` glow nodes use `blend-2-1`.
  - `button_hover_glow`, `auto_spin_hover`, and screen-halo nodes use `blend-1-8`.
- Validate both sides after the repair:
  - the live game prefab;
  - the donor/reference UI prefab that future resource inspections will read.

## Lifecycle Cleanup

Legacy 2.x controllers often assume arrays and child components stay valid until manual cleanup. In 3.x destroy flow, serialized/private fields may be `null` or child nodes may already be invalid.

Use defensive cleanup for migrated effect controllers:

- Treat arrays as nullable during `onDestroy` / cleanup.
- Clear the owner array before destroying child nodes to avoid double cleanup loops.
- Check `item`, `item.node`, and `item.node.isValid` before calling child cleanup.
- Unschedule callbacks and stop tweens before destroying effect nodes.

## Validation Checklist

- Refresh asset DB after file edits.
- Run formatter or formatting check for touched TypeScript.
- Run `validate_prefab_references` on the exact target prefab, not only a broad project scan.
- Search touched animation assets for stale `@f9941` and known black color keys when fixing VFX.
- Use MCP/runtime logs or screenshots for final parity when the preview is available.
