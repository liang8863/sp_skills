---
name: s-cli
description: Run the evidence-driven Slot client workflow for @s-cli requests.
---

# s-cli

Follow `.codex/agents/s-cli-agent/AGENT.md`.

1. Read target instructions and Git state. Use `references/slot-function-reference.md` only as an index, then load the matching feature reference(s).
2. Before selecting a resource project, validate `<resource-project>/doc/project_info.md`: exact `uiProjectPath`, `gameId`, and absolute `competitorUrl`; the path must match. URL and user notes are metadata, not behavior evidence. Otherwise return `NEEDS_RESOURCE_BASELINE` and do not dispatch Luna.
3. Keep the mandatory loop: `ROOT_CAUSE -> PLAN -> EXECUTE -> ACCEPT -> REPORT`. A failed acceptance preserves evidence, returns to `ROOT_CAUSE`, and requires a new plan.
4. Repair the narrowest shared boundary proven by code, resource, and runtime evidence. Keep `affectedFiles` limited to that complete slice.
5. Route Reel/Spin-reel/peeking/drop/layout and any Free Game/Bonus work to `gpt-5.6-sol`; route all other work to `gpt-5.6-terra`. Run `scripts/validate-plan.ps1`; dispatch `gpt-5.6-luna` only after validation and never for `--plan-only` or `--dry-run`.

Proceed without routine confirmation. Stop only on an Agent-defined status.
