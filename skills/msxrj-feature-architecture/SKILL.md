---
name: msxrj-feature-architecture
description: Enforce MSXRJ slot UI feature architecture. Use when creating, editing, reviewing, or wiring MSXRJ Cocos Creator TypeScript UI features, especially scripts under games/_run-slot-fe-msxrj/assets/scripts/ui or custom/GamePanel, prefab-mounted Component scripts, View responsibilities, and MsxrjPerformanceCtrl data orchestration.
---

# MSXRJ Feature Architecture

Use this skill when implementing MSXRJ gameplay UI features in Cocos Creator.

## Core Rules

- Treat `MsxrjPerformanceCtrl` as the central data controller. It binds View components, receives game/spin/cascade data, owns timing decisions, and dispatches read-only data into Views.
- Treat scripts that inherit from `Component` as View scripts when they are mounted on scene nodes or prefabs. The architectural exception is `MsxrjPerformanceCtrl`, which is a mounted central controller.
- Keep View scripts focused on prefab/node binding and presentation behavior.
- Store node/component references on prefabs through public `@property` fields whenever practical. Prefer prefab/meta bindings over hard-coded node paths so node renames or hierarchy changes do not silently break Views.
- Use local fallback lookup only for compatibility with existing prefabs, generated nodes, or one-off migration code; do not make path lookup the primary binding strategy for new View code.
- Let View scripts expose small presentation methods such as `setResult(...)`, `playShow(...)`, `reset()`, `clear()`, or `setState(...)`.
- Do not let View scripts mutate external game data, API payloads, service state, or shared controller state. A View may only update its own local fields and its owned node/component state.
- Prefer passing primitive values, arrays, or readonly/camelCase result slices from `MsxrjPerformanceCtrl` into Views. Do not make Views fetch spin data themselves.

## Workflow

1. Locate or create the View script for node-level presentation.
2. Bind the View script to the correct node or prefab.
3. Expose required node/component references as public typed `@property` fields and bind them in the prefab/scene asset.
4. Add a typed `@property` reference for the View on `MsxrjPerformanceCtrl`, with a conservative lazy fallback only if existing prefabs may not have the reference assigned.
5. In `MsxrjPerformanceCtrl`, choose the exact presentation timing and call the View method there.
6. Keep data mapping and data normalization outside the View. Put API field mapping in api/interceptors or type layers, and orchestration in `MsxrjPerformanceCtrl`.
7. Validate that the View can be driven by a simple method call without needing global state.

## Boundaries

View scripts may:

- Cache child nodes and components.
- Expose public serialized fields for prefab binding. External code should still treat those fields as View-owned implementation details.
- Toggle active state, labels, sprites, animations, tweens, opacity, positions, and local UI state.
- Provide reset/clear methods for the controller to call.

View scripts must not:

- Emit core spin-flow completion events unless they are explicitly responsible for a local animation callback contract.
- Call spin APIs, alter player balance, mutate spin result objects, or decide cascade/free-game progression.
- Subscribe directly to global game events when `MsxrjPerformanceCtrl` can route the data.

`MsxrjPerformanceCtrl` should:

- Subscribe to game events.
- Own current spin/cascade data references.
- Decide when each View updates.
- Coordinate multiple Views for one gameplay moment.
- Keep View calls clear and narrow, e.g. `this.yjzrMoltiplierView.setMultArray(result.multArray)`.
