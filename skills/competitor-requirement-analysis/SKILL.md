---
name: competitor-requirement-analysis
description: This skill should be used when the user asks to analyze a slot-game competitor from a URL, "竞品需求分析", "UI逆向工程", "参考竞品规则输出到doc", "spin 500次以上", "观察状态栏", "跑马灯状态", or "倍率动画逻辑". It guides long-spin competitor observation, UI reverse-engineering, evidence capture, and Chinese requirement documents under the target game's doc directory.
---

# Competitor Requirement Analysis

## Purpose

Translate a live slot-game competitor plus UI reverse-engineering evidence into implementable Chinese requirements. Enforce hard sampling thresholds before marking behavior as confirmed, especially reel layout, status-bar state transitions, cascade behavior, multiplier animations, and low-frequency modes.

Use this skill as a stricter layer above `doc-man-agent`: `doc-man-agent` provides general competitor requirement discipline; this skill adds mandatory long-spin sampling gates and specialized output for status bars and multiplier animations.

## Required Inputs

Collect or infer these fields before running analysis:

- Competitor URL.
- Target game project path, usually `games/<game-id>`.
- Output directory, defaulting to `<target-game>/doc/`.
- UI reverse-engineering evidence: screenshots, videos, asset manifests, network captures, decompiled resources, or user-highlighted regions.
- Sampling expectation. Default to `500+` total spins, `300+` status-bar spins, and `20` valid multiplier-animation events.

If the target project path is missing, inspect `games/` and ask only when the target cannot be safely inferred.

## Start Checklist

1. Read project instructions: `AGENTS.md`, `.codex/agent-team.yaml`, and `.codex/skills/doc-man-agent/SKILL.md` when present.
2. Verify target game reality with file inspection: confirm whether `<target-game>` is a populated Cocos project or only a stub/submodule/worktree shell.
3. Create a capture directory under `<target-game>/doc/competitor-captures/` or a date-stamped child folder.
4. Record environment facts before interaction: URL, date, viewport, browser surface, language, console logs, network availability, and capture paths.
5. Read the reference files required for the task:
   - `references/sampling-protocol.md` for spin gates and evidence accounting.
   - `references/status-bar-checklist.md` before analyzing the coin-area marquee/status bar.
   - `references/multiplier-animation-checklist.md` before analyzing cascade multiplier animations.
   - `references/output-templates.md` before writing final docs.

## Hard Gates

Treat these thresholds as completion gates, not nice-to-have goals:

| Area | Minimum confirmed evidence |
| --- | --- |
| Total spin sampling | 500 completed spins |
| Status-bar / marquee observation | 300 completed spins with the status-bar area visible or logged |
| Multiplier animation | 20 valid multiplier-animation events |
| Reel layout | At least idle, spin, stop, win, and cascade views or direct UI/resource proof |
| Requirement docs | Chinese documents in the target project's `doc/` directory |

Do not mark the requirement document complete if any hard gate is missed. Instead, write a partial document with a prominent `采样未完成 / 阻塞` section and list exact counts, evidence, and next recovery steps.

## Evidence Rules

- Separate `confirmed`, `inferred`, and `unknown` behavior.
- Count a spin only after the result has completed or the game clearly advances to the next spin.
- Count a status-bar observation only when the status-bar/marquee region above the coin values is visible or otherwise captured.
- Count a multiplier-animation event only when a multiplier/cascade animation is visibly triggered; ordinary spins without the animation do not count.
- Save screenshots or videos for representative states and all rare states. For high-volume sampling, save periodic checkpoints plus event-specific captures.
- Preserve raw evidence paths in the final docs. Do not rely on memory-only observations.
- If network or anti-debug behavior prevents sampling, document the exact failure and avoid inventing missing states.

## Workflow

### 1. Intake And UI Region Mapping

Identify key UI zones from the provided reverse-engineering evidence and live page:

- Reel frame, reel count, row heights, masking, symbol cell sizes, and special symbol positions.
- Coin/wallet row, bet row, win row, spin button, auto-spin, turbo, menu, paytable, and history buttons.
- Text marquee/status bar, usually above coin numbers. In the example JDSRY competitor, this is the blue banner above wallet/bet/win values.
- Multiplier animation target zones: symbol source, screen center, status-bar impact point, total win display, or free-game accumulator.

Record coordinates or visual descriptions for later sampling so the same UI area can be checked repeatedly.

### 2. Competitor Runtime Capture

Use Browser/DevTools or equivalent tooling to open the competitor URL. Prefer real runtime evidence over static guesses.

Capture:

- Loading, splash/start screen, first idle state, menu, paytable, rules, settings, auto-spin panel, history panel if available.
- Console logs and engine/version strings.
- Network request list, especially launch, game-info, spin, history, and resource requests.
- Static resource manifests when available.

If using a real-money environment or any action could spend real funds, stop and ask for confirmation or switch to demo mode.

### 3. Spin Sampling

Follow `references/sampling-protocol.md`. Prefer auto-spin/turbo/skip controls when they reflect real player behavior. Sample until reaching:

- 500 completed total spins.
- 300 completed spins with status-bar observations.
- 20 confirmed multiplier-animation events.

Maintain a sampling ledger with at least:

- spin index or count range
- timestamp
- status-bar text/state
- reel/cascade state
- multiplier animation event id if present
- screenshot/video path
- blockers or network retry notes

### 4. Module Analysis

Analyze these modules explicitly:

- Reel layout: reel count, row count per reel, visible masks, pay ways/lines, special symbol positions, long symbols, and stop order.
- Status bar / marquee: all observed texts, triggers, priorities, durations, interruption rules, and abnormal states.
- Cascade and multiplier animation: trigger, source, path, center aggregation, downward impact, target UI, timing, skip behavior, and win update timing.
- Paytable and game rules: symbol payouts, wild/scatter/bonus behavior, max win, free-game retrigger, auto-spin options, and bet controls.
- Data and API: launch/game-info/spin payloads when visible; mark encrypted or unavailable data honestly.

### 5. Output

Write Chinese documentation under `<target-game>/doc/`. Use `references/output-templates.md` for required shapes.

Recommended files:

- `<game-id>-competitor-requirements-YYYYMMDD.md`
- `<game-id>-spin-sampling-log-YYYYMMDD.md`
- `<game-id>-status-bar-state-matrix-YYYYMMDD.md`
- `<game-id>-multiplier-animation-matrix-YYYYMMDD.md`

Use one comprehensive document only when the task is small, but still include all matrices and sampling counts.

## Completion Standard

Finish with:

- A concise Chinese summary.
- Absolute paths to created docs.
- Actual sampling counts.
- Whether all hard gates passed.
- Remaining unknowns and exact next steps if blocked.

Never present a partial long-spin study as complete. A crisp blocker report is better than a confident fantasy; future implementation will thank present-you.

## Reference Files

- `references/sampling-protocol.md`: spin-count ledger, evidence thresholds, and blocked-state handling.
- `references/status-bar-checklist.md`: status-bar/marquee trigger checklist and matrix fields.
- `references/multiplier-animation-checklist.md`: multiplier animation event definition and capture fields.
- `references/output-templates.md`: Chinese doc templates and required sections.
