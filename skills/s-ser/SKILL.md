---
name: s-ser
description: Implement, document, and accept Slot server-runner work from evidence through deterministic simulator-ready verification. Use when a request starts with @s_ser, @s-ser, or $s-ser, or requires a Slot game's server rules, response contract, seeds, math checks, debug HTTP validation, or server README updates.
---

# s-ser

Follow `.codex/agents/s-ser-agent/AGENT.md`.

1. Start from the target runner README, game specification, Git state, and the shared function index at `.codex/agents/s-cli-agent/references/slot-function-reference.md`.
2. Before writing a replication plan or freezing a response contract, locate and read the corresponding resource project. Prefer the target client's `doc/project_info.md`; otherwise resolve the sibling `CC3Proj/<game>_UI/doc/project_info.md`. Read the resource project's project/competitor metadata and relevant `doc/` reports, then trace the actual client scripts, Prefab/Scene bindings, and call sites that consume game results.
3. Reverse-engineer the client/server protocol from that resource-engine evidence: build a `client consumer -> response/request field -> server producer -> lifetime -> deterministic assertion` matrix. Use `assets/scripts` (`GameService`, API/types/mapper, Performance, Reel, Free Game, multiplier and payout modules) and serialized Prefab/Scene properties to establish field names, frame order, layout shape, and state transitions. The shared function index is only a boundary map, never a source of game rules or field meanings.
4. Treat `doc/project_info.md` competitor URLs and other resource reports as evidence locators. A URL entry or static resource name does not prove a runtime response, payout, timing, or protocol field; keep those items `inferred` or `unknown` until runtime/provider evidence confirms them. Redact signed query parameters in new documents.
5. Keep the mandatory loop: `EVIDENCE -> CONTRACT -> IMPLEMENT -> VERIFY -> DOCUMENT -> REPORT`; the resource-project protocol pass is a required part of `EVIDENCE` before `CONTRACT`.
6. Preserve deterministic seeds and simulator instructions under the target runner's `doc/` directory whenever a feature can be represented by a reproducible response.
7. For every server implementation change, use `D:\WorkSpace\Server\slot-simulator-game-ways` as a client-facing verification surface. If the game has no simulator view, add a minimal route/view before claiming client verification; do not substitute a sibling game's page without recording the contract mismatch.
8. Do not require Chrome MCP for acceptance. Prefer server tests, direct HTTP checks, and the slot simulator; time-box any optional browser run.

## Runner README format

For a runner README creation or reformatting task, first read
`references/sjzbg-runner-readme-style.md`. It is the canonical structural reference for
the compact runner-contract layout: requirement documents, core mechanisms, Free Game,
symbol table, layout structure, detail fields, SDK overrides, and repair notes.

Keep the heading hierarchy and documentation depth, but replace every SJZBG-specific rule,
path, port, symbol, seed, response field, and acceptance status with verified facts from the
target runner. Never copy the reference game's semantics merely to fill a missing contract;
label the missing target evidence instead.

### README output reference

The completed target README should be a runnable-contract document, not a changelog. Follow
the reference's concise section sequence and produce these target-specific outputs:

1. A game identity/scope statement, then `需求文档` linking only the target game's authoritative
   specification and runner evidence.
2. `核心机制` with focused subsections for the board/index projection, each nonstandard symbol
   or drop lifetime, and multiplier/payout timing; add `Free Game` when the game supports it.
3. `符号表` and `Layout 結構` tables that state exact IDs, payout boundaries, dimensions,
   coordinate/index translation, compact/padded projections, or fixed/converted cells as the
   target needs.
4. `Detail 欄位` describing every target-specific response member, then `SDK 重寫函數` as a
   table of the overridden hook, SDK default, and target-specific difference.
5. `修復說明` as a numbered target-specific change and acceptance summary. Put links here to
   seed fixtures, simulator evidence, isolated runtime notes, protocol matrices, commands, and
   remaining gates. Preserve `confirmed`, `inferred`, `unknown`, `NEEDS_PROTOCOL_EVIDENCE`,
   `CLIENT_CONTRACT_GAP`, and `NEEDS_MATH_SIGNOFF` instead of inventing certainty.
6. Before reporting, verify the heading sequence, all relative README links, current coordinate
   and symbol values, and `git diff --check`. State explicitly when the update is documentation
   only and therefore did not require a server restart or a new gameplay test run.

## Mandatory simulator verification gate

The server task is not verified until the slot simulator has consumed the actual target-game
HTTP response. For BSRQQ, the target route is `/bsrqq` and the request game code is `BSRQQ`.
The simulator step is a client-contract check, not a replacement for unit tests or
mathematical sign-off.

1. Start the server with an isolated config and record the exact REST URL, port, Redis DB,
   MySQL database, game code, bet, seed, and auth mode. Never point the simulator at the
   shared HGCS runtime.
2. Add or update `slot-simulator-game-ways/src/views/<game-id>/` and its router/nav entry
   when the target game is missing. The page must send the target `game_code` (for this task,
   `BSRQQ`), expose seed and bet controls, render all returned frames, and show the raw
   contract fields consumed by the target resource project. For BSRQQ these are
   `rl/orl/wp/wpl/rns/gm/fs/ssaw/tw/twbm/imw/sc/st/nst`. A text/grid renderer is acceptable
   when production art is unavailable, but it must not silently reinterpret layout indexes.
3. Run the simulator in local mode against the isolated server (normally `npm run dev`),
   execute at least one deterministic seed fixture for each changed path, and save the
   request, raw response, rendered URL, console/build result, and screenshot or equivalent
   evidence under the runner's `doc/` directory.
4. Mark results separately:
   - `SIMULATOR_PASS`: the simulator loaded the target-game route, sent the intended request, and
     rendered every required frame/field without a client exception.
   - `VERIFY_FAILED`: server or simulator command failed; include seed/request and output.
   - `CLIENT_CONTRACT_GAP`: HTTP returned data but the target-game simulator/client mapper cannot
     consume it; do not hide this by converting it to a sibling-game shape.
   - `NEEDS_PROTOCOL_EVIDENCE`: the simulator cannot validate a field because the resource
     consumer exists but the provider/raw response is still unknown.
5. HTTP 200, a successful build, an asset existing, or a non-empty grid alone is smoke
   evidence. Client verification requires the simulator request/response and rendered state
   to be recorded together. If the simulator is unavailable, stop at `NEEDS_SIMULATOR` and
   report the exact missing command/path instead of claiming acceptance.

## Resource-project protocol gate

For competitor replication, do not derive the server contract from a sibling runner, a generic Engine schema, or screenshots alone. The plan must record:

- Resource project path, baseline commit, `doc/project_info.md`, and every resource `doc/` report read.
- Client entry points and call paths for request construction, response mapping, frame iteration, settlement, restore/last-spin, buy entry, and error handling.
- Prefab/Scene fields that constrain protocol data, including serialized array lengths, symbol/display bindings, and feature/multiplier holders.
- A source-to-target adaptation table: resource/client evidence, proposed server field or request member, consumer lifetime, deterministic assertion, and unresolved gap.
- Explicit labels `confirmed`, `inferred`, `unknown`, `NEEDS_PROTOCOL_EVIDENCE`, and `CLIENT_CONTRACT_GAP` whenever the resource logic or runtime evidence is incomplete.

If the resource project cannot be located, its `doc/` cannot be read, or the client consumer path is missing, stop contract freezing and report `NEEDS_RESOURCE_BASELINE` or `NEEDS_PROTOCOL_EVIDENCE` with the exact missing path. Do not fill the gap with copied `jdsry`/sibling values.
