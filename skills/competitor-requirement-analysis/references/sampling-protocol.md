# Sampling Protocol

## Goal

Gather enough runtime evidence to turn competitor behavior into implementable requirements without guessing. Treat spin sampling as a measured experiment: count completed spins, record visible states, and preserve proof.

## Minimum Counts

| Counter | Required minimum | Count only when |
| --- | ---: | --- |
| `total_spins` | 500 | A spin result completes or clearly advances to the next spin. |
| `status_bar_spins` | 300 | The status-bar/marquee area is visible or logged during that spin. |
| `multiplier_events` | 20 | A real multiplier/cascade animation is observed. |

Do not substitute `500 clicks` for `500 completed spins`. If network retry, long cascade, bonus entry, or error keeps one spin unresolved, keep it as one in-progress spin until resolved.

## Recommended Ledger

Maintain a markdown table or CSV-like section in the sampling log:

| Field | Meaning |
| --- | --- |
| `sample_id` | Sequential observation id. |
| `spin_index` | Completed spin number or range. |
| `timestamp` | Local time of observation. |
| `mode` | Base, free spin, auto spin, turbo, restore, error, or unknown. |
| `status_bar_text` | Exact visible text when readable. |
| `status_bar_state` | Idle, spin, win, cascade, multiplier, free-game, retry, error, etc. |
| `reel_state` | Idle, spinning, stopping, win-highlight, cascade, refill, bonus. |
| `multiplier_event_id` | Link to multiplier matrix row when observed. |
| `capture_path` | Screenshot/video path. |
| `notes` | Network retry, skipped animation, uncertain OCR, or other caveat. |

## Sampling Strategy

1. Start with manual exploration: load, splash, idle, menu, paytable, rules, settings, bet controls, auto-spin panel.
2. Enable turbo only after documenting normal-speed behavior, unless the user asks to prioritize volume.
3. Use auto-spin for volume when available. Prefer the largest safe auto count, such as 500 or 1000.
4. Keep the status-bar region visible during at least 300 completed spins. Avoid opening panels that cover the bar during this phase.
5. Capture periodic checkpoints every 25-50 spins, plus every rare event.
6. Capture every multiplier animation event until 20 valid events are logged.
7. Stop auto-spin before finishing the task or when handing control back, unless the user explicitly asks to keep it running.

## Valid Completion

Mark sampling complete only when all required counters meet the threshold and the final docs cite the evidence paths.

Mark sampling blocked when:

- The game cannot be entered.
- The URL expires or returns forbidden/time-expired resources.
- Browser tooling cannot interact with the canvas.
- Spin speed makes 500 spins infeasible in the current turn.
- Network retry or API failure prevents reliable completion.
- The page uses real-money flow and no demo/test mode is available.

For blocked sampling, write exact counts achieved, elapsed time, failure screenshots/logs, and a recovery plan. Do not backfill missing states from assumptions.
