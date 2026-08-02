# Status-Bar / Marquee Checklist

## Identification

Locate the text status area before spin sampling. In many PG-style mobile slot games, the status bar sits directly above wallet/bet/win coin numbers. It may be a blue, dark, or framed banner with scrolling or flashing text.

Record:

- Screenshot with highlighted or described region.
- Approximate screen coordinates.
- Layer relationship with reels, buttons, and win display.
- Whether text scrolls, fades, swaps instantly, scales, flashes, or shakes.

## Required Observation

Observe the status bar for at least 300 completed spins. Count only spins where the status-bar area is visible or captured.

## State Matrix Fields

Use these columns in the output matrix:

| Field | Description |
| --- | --- |
| `state_id` | Stable id, such as `idle-default`, `spin-start`, `cascade-win`. |
| `visible_text` | Exact Chinese text or best OCR with uncertainty marker. |
| `trigger` | Event that causes the text to appear. |
| `duration` | Approximate time, or `until next event`. |
| `priority` | Which state wins when multiple events happen together. |
| `interruptible_by` | Events that replace or cancel the text. |
| `animation` | Scroll, fade, flash, bounce, shake, or none. |
| `capture_path` | Evidence screenshot/video. |
| `confidence` | confirmed, inferred, or unknown. |

## Trigger Checklist

Check these possible status-bar states:

- Loading or entering game.
- Default idle slogan.
- Bet changed.
- Spin start.
- Reel stopping.
- No win.
- Normal win.
- Total win / all win.
- Win highlight.
- Cascade / tumble starts.
- Cascade refill.
- Cascade ends.
- Wild conversion.
- Multiplier appears.
- Multiplier flies to center.
- Multiplier drops or applies to status bar.
- Free spin trigger.
- Free spin count display.
- Free spin retrigger.
- Free spin total win.
- Max win.
- Auto-spin start.
- Auto-spin remaining count.
- Auto-spin stop.
- Turbo on/off.
- Insufficient balance.
- Network busy / retry.
- Session expired or game-state sync error.
- History/paytable/rules overlays opening and closing.

## Priority Notes

Pay special attention to priority collisions:

- Win text versus next-spin idle text.
- Cascade text versus multiplier text.
- Free-spin total win versus max-win text.
- Network retry versus normal spin/win text.
- Auto-spin remaining text versus event-specific text.

If the text is unreadable because it scrolls quickly, capture video or rapid screenshots and mark OCR confidence.
