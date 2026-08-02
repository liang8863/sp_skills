---
name: slot-fe-client-workflow
description: "Project workflow index migrated from .claude. Use for Slot FE Client tasks that need project-wide rules, Git branch merge/rebase conflict handling, migrated Claude hooks/commands/agents behavior, Cocos Creator workflow, commit/review workflow, MCP validation, or guidance on which project skill to load."
---

# Slot FE Client Workflow

Use this as the project-level entry point for migrated `.claude` behavior.

## Baseline Rules

- Reply in Chinese by default, matching the user's simplified/traditional style when practical.
- For command-line operations, prefer Git Bash (`C:\Program Files\Git\bin\bash.exe`) when available, especially for text/file inspection commands such as `sed`, `rg`, `ls`, and `git`; fall back to the current shell if Git Bash is unavailable.
- For Bootstrap/API/Container/SlotReel initialization work, read `.codex/errors.md` before making changes.
- Do not direct-import `slot-game-ext-module` source from game code. Use `ServiceBridge`, `window.ExternalModules` during bootstrap, and `bridge/types` for compile-time types.
- Cocos Creator 3.8 targets ES2015 here. Avoid ES2016+ APIs unless the local project config proves otherwise.
- Prefer prefab `@property` bindings over runtime lookup in View scripts.
- Manage relationships between View-layer `Component` scripts through prefab hierarchy and `@property` bindings whenever possible; avoid wiring View-to-View dependencies by runtime lookup.
- Prefer pre-mounting reusable child prefabs under the referencing prefab instead of dynamically loading/instantiating them at runtime; keep them inactive if needed and expose them through the owning View component.
- Store data used by a prefab on that prefab or its child prefab, not in the scene, unless the data is truly scene-specific; this reduces merge conflicts during multi-branch development.
- Do not ask the user to manually bind prefab fields in Cocos Editor when the binding can be automated by JSON/MCP/tooling.
- Do not push to any remote automatically. Only run `git push` or any remote-publishing command when the user explicitly asks to push/推送 in the current request.
- For Cocos Creator game changes, especially `games/yjzr`, do not use `npx tsc` as syntax or compile validation. Use MCP to monitor or read the Cocos Creator console log and report compile/runtime errors from there; if MCP/Editor access is unavailable, state that console validation was not completed.
- For Cocos UI, animation, prefab, reel, bonus, transition, or BigWin changes, use `cocos-mcp-workflow` visual screenshot acceptance before finishing when tools are available. Prefer a real preview/browser runtime, temporarily trigger runtime-only test data when needed, capture before/target/after screenshots, compare with the relevant `doc/` effect images, check console/logs, and clean up the temporary state.
- If Cocos/MCP generates an untracked `assets/.meta` directory meta file and it has no functional impact, do not rush to delete it during active debugging. Recheck and handle it before commit/staging.
- For YJZR visual/audio/UI assets, first use assets under `games/yjzr/assets/resources/yjzr_res`. Fall back to the shared/resource project only when the needed asset is absent there. For duplicate localized atlas frame names, prefer UUIDs from `resources/yjzr_res/**.meta`.
- Read `.codex/references/workflow-concepts.md` for common directory definitions, resource project path, docs output rules, Cocos MCP port convention, and Git routing constraints.
- Common directories: `.codex` stores Codex skills/agents/config; `docs` stores output documents grouped by coarse folder; `E:\CCCCCC\UIProj\387Proj\NewProject` is the default resource project; `E:\CCCCCC\slot-fe-client` is the project root; `games` contains game instances, with `yjzr` currently in active development.
- PM short workflow invocation reads `.codex/agent-team.yaml.workflow_defaults`; missing project, allowed agents, reference materials, expected delivery, and stop conditions should be filled from that config unless the current user message overrides them.
- Current Cocos MCP port convention: `yjzr:30001`, `yjzr-01:30002`, then increment by YJZR suffix. If a project differs, update that project's MCP config after confirming the target.
- All Git modification operations should route to `git-agent`; simple read-only Git checks can use the fastest safe command path.
- Failure fallback: QA fail routes to PM, then doc man refines requirements with the bug report, then PM re-runs development; cocos man implementation/self-test fail routes to PM for resource/doc/asset dispatch before development restarts.

## Branch Merge / Rebase Rules

When the user asks to pull or merge a remote branch into a game branch, especially `games/yjzr`:

- Work in the actual nested repo. Confirm `git rev-parse --show-toplevel`, current branch, remote refs, and dirty state before changing history.
- Treat "merge/pull branch X into `dev`" as a rebase workflow by default unless the user explicitly asks for a merge commit. The goal is that `dev` remains the final branch and `dev`'s unique commits appear at the top of the final graph.
- Direction rule: save the current `dev` first, then rebase `dev` onto the incoming/source branch. For example, when integrating `yjzr-01` into `dev`, create a backup such as `tmp_dev`, check out `dev`, then run `git rebase yjzr-01` or `git rebase --onto yjzr-01 <upstream-base> dev` when the replay range must be explicit. Do not rebase `yjzr-01` onto `dev` for this workflow unless the user explicitly wants source commits to be on top.
- After the rebase, confirm the top ref is `dev` and the visible top commits are the expected `dev` commits. Do not stop with only the source branch advanced while `dev` remains behind.
- Avoid large cross-line merge graphs. Do not create normal merge commits for routine branch integration. Prefer rebase/linear history, and use `git merge --ff-only` only when the result is already linear and fast-forwardable.
- If history already contains merge commits or long crossing lines, first save the current `dev` to a backup branch such as `tmp_dev`, then linearize or rebuild `dev` from its intended content; verify the final tree still matches the backup with `git diff tmp_dev dev` before restoring local work.
- If the incoming/source branch is checked out in another worktree, do not rewrite it unless necessary. Use it as the rebase base/ref; if that branch itself must be cleaned or rebased first, operate in that worktree after protecting its dirty state.
- When the source branch tracks or was forked from another baseline such as `origin/dev`, use `git rebase --onto <source> <upstream-base> dev` so only the intended `dev` commits are replayed onto the source branch. Avoid replaying upstream commits that already exist under different hashes.
- Inspect divergence with `git log --left-right` or `git rev-list --left-right --count` before rebasing.
- Protect user/editor work before rebase. If the target repo is dirty, stash tracked and untracked local changes with a clear message, then restore them after the rebase. Do not discard unrelated local Cocos profile/editor changes.
- Resolve conflicts by preserving both valid feature lines, not by blindly choosing one side. Let the newer architecture own the integration point: for example, keep way panel / infoboard changes from a panel branch while adapting older payout, multiplier, or BigWin code to that new path instead of resurrecting deleted legacy panels.
- For response mapping conflicts, keep backend compatibility when both fields are plausible. Example from YJZR: keep `d.way ?? d.ways`, keep `MultArray` under `d`, and preserve `d.MultArray || d.ma` plus `d.gm`/settlement fields when present.
- For prefab/scene conflicts, preserve required `targetInfo` / `targetOverrides` structures and validate the file has no conflict markers. For JSON-like Cocos profile files, parse them after resolving.
- After resolving each conflict batch, run marker checks such as `rg -n "^(<<<<<<<|=======|>>>>>>>)"` and `git diff --check` before continuing the rebase.
- After the merge/rebase completes, restore any pre-merge stash and resolve only the conflicts it creates. Keep restored local editor/profile changes unstaged unless the user asked to commit them.
- After the merge/rebase completes, refresh the Cocos Editor/asset database through MCP, then inspect Cocos Console, MCP recent logs, and project logs. Fix merge-introduced script/import/prefab/runtime errors and repeat refresh + log inspection until there are no new errors from the merge. Separate and report unrelated pre-existing errors instead of counting them as accepted validation.
- After code conflicts are resolved, use `cocos-mcp-workflow` to open or focus the game with MCP and visually inspect the areas touched by conflicts. Run or trigger the relevant game flow, capture/check screenshots where useful, and compare against effect images and requirements under that game's `doc/` directory. For YJZR, validate against `games/yjzr/doc/` screenshots for way panel, infoboard, multiplier doors, multiplier combine, and BigWin behavior. If MCP/Editor is unavailable, read Cocos logs as fallback and explicitly report that visual validation was not completed.
- If rebase rewrites a branch that tracks remote (ahead/behind diverges), explain the push implication. Use normal push only when fast-forwardable; if the user asks to push rewritten history, prefer `git push --force-with-lease`.

## Migrated Claude Skills

Load the specific skill when relevant:

- `platform-architecture`: architecture, module boundaries, cross-project design.
- `code-style`: TypeScript style, ES2015 limits, Cocos component binding rules.
- `naming-conventions`: file/class/interface/event/resource naming decisions.
- `service-bridge-api`: ServiceBridge APIs and ExternalModules service access.
- `slot-game-bootstrap`: Bootstrap order, ExternalModules loading, custom container configuration.
- `slot-reel-system`: SlotReel logic/hooks, scatter peek, spin/drop/clear sequences.
- `yjzr-slot-reel-layout`: YJZR reel rows, 5/6-column visual layout, symbol sprite/background/blur config, mask structure, and OddsPanel alignment.
- `slot-game-debugging`: runtime/API/layout debugging, reelLayout, long symbols, backend-vs-frontend responsibility.
- `cocos-mcp-workflow`: validate and operate Funplay Cocos MCP, inspect Cocos logs/resources/tools, and fall back when wrappers are empty or scene calls timeout.
- `custom-ui-component`: custom Cocos UI View patterns and ServiceBridge binding.
- `prefab-scene-json`: prefab/scene JSON edits, script class IDs, targetOverrides, `@property` binding automation.
- `prefab-ui-builder`: building or modifying prefab UI via one-off scripts/templates.
- `host-bridge-protocol`: iframe HostBridge messages and modal/token/language flow.
- `monorepo-management`: submodule and shared bridge/ext-module/template synchronization.
- `error-journal`: how to consult and maintain `.codex/errors.md`.
- `git-agent`: branch state, rebase-based pull/merge, conflict handling, commit staging/message format, tag, and push safety.

Scoped project skills migrated from subproject `.claude` folders:

- `hbfy-hbfy-game-logic`: HBFY-specific game logic.
- `hbfy-new-game-setup`, `template-new-game-setup`, `thpsj-new-game-setup`: scoped new-game setup workflows.
- `yjzr-msxrj-game-logic`, `run-msxrj-msxrj-game-logic`: MSXRJ/YJZR game logic references.
- `template-bridge-bridge-internals`, `yjzr-bridge-bridge-internals`, `run-msxrj-bridge-bridge-internals`: bridge internals by scope.
- `template-bridge-i18n-system`, `yjzr-bridge-i18n-system`, `run-msxrj-bridge-i18n-system`: i18n system by scope.
- `ext-module-ext-module-dev`, `ext-module-logger-usage`: ExternalModules development and Logger usage.

## Migrated Claude Commands

- Use `code-review-workflow` when the user asks for `/code-review` equivalent behavior or any code review.
- Use `commit-message-workflow` when the user asks to generate commit messages without committing.
- If the user asks Codex to actually commit, use normal Codex git workflow instead of the migrated `/commit` rule that was read-only in Claude.

## Migrated Claude Agents

Claude agents were converted into role skills:

- `code-quality`: read-only review role.
- `architect`: read-only architecture role.
- `cocos-expert`: Cocos Creator implementation role.
- `services-expert`: ServiceBridge/container/service implementation role.
- `dynamic-loading`: ExternalModules loading/deployment role.
- `slot-specialist`: slot mechanics and hooks role.
- `testing-docs`: testing and documentation role.

Use Codex sub-agents only when the user explicitly asks for delegation or parallel agent work. Otherwise, use these role skills directly in the main thread.

## Migrated Hooks

The original Claude hooks are preserved in `.codex/hooks` as reference scripts:

- `session-start.js`: reminder to reply in Chinese and consult the error journal.
- `prettier-format.js`: auto-format changed `.ts` files when a project has `.prettierrc.js`.
- `update-readme-skills.js`: update README skill/agent sections after Claude skill changes.
- `check-prefab-manual-op.js`: block final answers that ask the user to manually bind prefab fields.

Codex does not auto-run these hooks. Apply their intent manually where relevant.
