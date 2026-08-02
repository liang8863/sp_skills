# Multiplier Animation Checklist

## Valid Event Definition

Count a multiplier animation event only when a multiplier-related visual effect is observed. A normal spin containing no multiplier animation does not count.

A valid event usually includes one or more of:

- Multiplier symbol appears on a reel.
- Wild or special symbol transforms into `x2`, `x3`, `x5`, or another multiplier.
- Multiplier value flies toward screen center.
- Multiplier aggregates at center or over the reel frame.
- Multiplier drops, smashes, or transfers into the status-bar/marquee area.
- Total win or status-bar value updates after the multiplier lands.

## Required Count

Capture at least 20 valid multiplier animation events. If the game makes these events rare, continue sampling or mark the count gap as a blocker.

## Event Matrix Fields

Use these columns in the output matrix:

| Field | Description |
| --- | --- |
| `event_id` | Sequential id, such as `mul-001`. |
| `spin_index` | Spin number where event occurred. |
| `mode` | Base, free spin, bonus, auto, turbo, or unknown. |
| `source_position` | Reel/row or screen location where multiplier starts. |
| `multiplier_value` | `x2`, `x3`, `x5`, accumulated value, or unknown. |
| `trigger` | Win, cascade, wild conversion, free-spin accumulation, etc. |
| `path` | To center, to status bar, to win value, down-smash, or other. |
| `impact_target` | Status bar, center counter, total win, bottom accumulator. |
| `timing` | Approximate sequence and duration. |
| `skip_behavior` | Effect of turbo, click, space, or auto-spin. |
| `result_update` | When text/win amount changes relative to animation. |
| `capture_path` | Screenshot/video evidence. |
| `confidence` | confirmed, inferred, or unknown. |

## Sequence Checklist

For each observed event, answer:

- Does the multiplier appear before or after symbol explosion?
- Does it wait for all winning symbols to resolve?
- Does it fly to the screen center first?
- Does it then drop into the status bar/marquee area?
- Does the status bar text change before impact, on impact, or after impact?
- Does the win amount update incrementally or all at once?
- Are multiple multipliers added, multiplied, or applied sequentially?
- Does free spin preserve multiplier state between spins?
- Does skip/turbo shorten only movement, or also suppress intermediate frames?

## Common Unknowns

Mark these explicitly when not observed:

- Maximum multiplier value.
- Multiple multiplier ordering.
- Interaction with max-win cap.
- Interaction with retriggered free spins.
- Whether animation paths differ between base game and free game.
