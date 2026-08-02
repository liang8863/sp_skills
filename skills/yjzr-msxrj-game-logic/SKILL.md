---
name: yjzr-msxrj-game-logic
description: Codex entry for YJZR MSXRJ game logic work. Delegates to the shared games/yjzr skill source and requires MCP runtime validation after feature development.
---

# Shared YJZR Skill Entry

Read the authoritative shared skill file completely before using this entry:

- Source file from this skill directory: `../../../games/yjzr/.claude/skills/msxrj-game-logic/SKILL.md`
- Source file from a yjzr-* project root: `../yjzr/.claude/skills/msxrj-game-logic/SKILL.md`

The source under `../yjzr` is the only maintained copy. Follow all of its instructions, including MCP runtime validation after feature development.

## YJZR Asset Priority

- For YJZR visual/audio/UI assets, first use assets under `games/yjzr/assets/resources/yjzr_res`.
- Fall back to the shared/resource project only when the needed asset is absent there.
- For duplicate localized atlas frame names, prefer UUIDs from `resources/yjzr_res/**.meta`.
