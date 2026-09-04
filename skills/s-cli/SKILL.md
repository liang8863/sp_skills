---
name: s-cli
description: Run the evidence-driven Slot client workflow for @s-cli requests.
---

# s-cli

Follow `.codex/agents/s-cli-agent/AGENT.md`.

1. Invoke the `superpowers` skill before analysis or implementation. Let it select the applicable process skill: debugging work uses systematic debugging, new behavior uses brainstorming before planning, and execution uses the plan/execution workflow. If a selected process skill is unavailable, preserve the same evidence-driven intent locally and record the gap in `result.md`.
2. Read target instructions and Git state. Always load `slot-game-debugging` for Spin/Reel/Drop/Cascade/Multiplier/Free Game/Bonus work. Use `.codex/agents/s-cli-agent/references/slot-function-reference.md` only as an index, then load the matching feature reference(s). This is the canonical shared function lookup table for both `@s_cli` and `@s_ser`.
3. Before selecting a resource project, validate `<resource-project>/doc/project_info.md`: exact `uiProjectPath`, `gameId`, and absolute `competitorUrl`; the path must match. URL and user notes are metadata, not behavior evidence. Otherwise return `NEEDS_RESOURCE_BASELINE` and do not dispatch Luna.
4. Keep the mandatory loop: `ROOT_CAUSE -> PLAN -> EXECUTE -> ACCEPT -> REPORT`. A failed acceptance preserves evidence, returns to `ROOT_CAUSE`, and requires a new plan.
5. For any Spin/Reel/Drop/Cascade/Multiplier/Free Game/Bonus task, the first ROOT_CAUSE gate is `serverDataCheck`: capture the raw API/debug HTTP response, compare it with the mapper and current runner contract, validate layout/frame/state fields, and explicitly assign responsibility to server, API, mapper, or client. Missing or invalid raw data stops the task before PLAN.
6. Repair the narrowest shared boundary proven by code, resource, server, and runtime evidence. Keep `affectedFiles` limited to that complete slice.
7. Route all turntable-related work, including Reel/Spin-reel/SlotReel/peeking/drop/layout/mask and Free Game/Bonus flows, to `gpt-5.6-terra`; all other work also defaults to `gpt-5.6-terra`. Run `scripts/validate-plan.ps1`; dispatch `gpt-5.6-luna` only after validation and never for `--plan-only` or `--dry-run`.
8. Constrain all implementation writes to the target project under `D:\\WorkSpace\\slot-fe-client\\games\\<project>\\`. Required workflow artifacts may only be written under that same project's `doc\\s_cli\\`; every other directory is read-only. `assets\\scripts\\bridge\\**` is externally linked and read-only even within the target project. If completion requires a write outside this boundary, stop with `OUT_OF_CLIENT_PROJECT_SCOPE` and report the required path instead of changing it.

Proceed without routine confirmation. Stop only on an Agent-defined status.
