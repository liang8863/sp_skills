---
name: s-cli
description: Use when the user invokes @s_cli or @s-cli, or asks the Slot client implementation agent to analyze a requirement with Terra/Sol and execute the validated plan with Luna against resource-project behavior.
---

# s_cli

Read `.codex/agents/s-cli-agent/AGENT.md` and follow it as the orchestration contract.

Use `.codex/agents/s-cli-agent/references/slot-function-reference.md` for module discovery and acceptance coverage. Never use the reference to invent behavior not proven by the matched resource project.

Route direct Reel/SlotReel/Spin-reel/peeking/drop/layout work and any Free Game/Bonus-related requirement to `gpt-5.6-sol`; route all other Slot modules to `gpt-5.6-terra`. Free Game/Bonus scope includes trigger, loading, dedicated UI/resources, retrigger, restore, per-round Big Win, final settlement, exit, and their API/event/audio/Prefab/Scene paths. After analysis, validate `plan.json` with `scripts/validate-plan.ps1`; dispatch `gpt-5.6-luna` only when validation succeeds and the mode is neither `--plan-only` nor `--dry-run`.

Proceed without routine user confirmation. Stop only on a status defined by the Agent contract.
