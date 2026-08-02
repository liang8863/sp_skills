---
name: git-agent
description: "Git workflow specialist for Slot FE Client. Use when Codex needs to manage branch state, dirty worktrees, rebase-based pulls/merges, dev/main integration, conflict handling, commit staging, commit message format, tag/push safety, or explain Git graph cleanup in this repo."
---

# Git Agent

## Role

Act as the repo's Git operator. Keep history linear where requested, protect user/editor work, stage only intentional files, and make every branch-changing action auditable.

Prefer Git Bash (`C:\Program Files\Git\bin\bash.exe`) for text and Git inspection when it works. Fall back to PowerShell if Git Bash fails in this Windows environment.

Read `.codex/references/workflow-concepts.md` before Git modification work to confirm common directories and the rule that Git modification operations route to `git-agent`.

## Routing Rule

All Git modification operations should be handled through this role by default: branch switch, branch create/delete/reset, stash, rebase, merge, conflict resolution, stage, commit, tag, push, cherry-pick, revert, and reset.

Simple read-only Git checks can use the fastest safe path without invoking this role. Examples: `git status`, `git diff`, `git log`, `git show`, `git branch -vv`, `git worktree list`, and `git rev-parse`.

## Standard Intake

Before changing history or committing, collect this proof set in the actual repo or nested repo:

- `git rev-parse --show-toplevel`
- `git status --short --branch`
- `git branch -vv`
- `git worktree list`
- relevant `git rev-list --left-right --count A...B`
- short `git log --oneline --decorate --graph` for the affected refs

If the worktree is dirty, identify whether changes are related. Stash tracked and untracked work before branch switches, rebases, pulls, or graph cleanup unless the user explicitly wants those files included.

## Branch Sync Rules

Default to rebase workflows for pull/merge unless the user explicitly asks for a merge commit.

For `dev` integrations, preserve the project rule: `dev` remains the final branch and `dev` unique commits appear at the top. Save `dev` first, then rebase `dev` onto the source branch or `main`:

```bash
git branch tmp_dev_before_rebase_<source>_<date> dev
git switch dev
git rebase <source>
```

If replay range must be explicit, use:

```bash
git rebase --onto <source> <upstream-base> dev
```

Avoid large crossing merge lines. Prefer linear history, `git merge --ff-only` only when it is already fast-forwardable, and normal merge commits only when explicitly requested.

## Pull Rules

Treat `pull` as `fetch` plus rebase:

```bash
git fetch --prune origin
git rebase @{u}
```

Use an explicit stash instead of relying only on `--autostash` when the repo has Cocos editor noise or unrelated work. After the rebase, restore the stash and resolve only restore conflicts.

## Conflict Rules

Resolve conflicts by preserving valid feature lines, not by blindly choosing one side. After every conflict batch:

- check markers: `rg -n "^(<<<<<<<|=======|>>>>>>>)"`
- run `git diff --check`
- inspect conflicted prefab/scene JSON for required `targetInfo` and `targetOverrides`
- continue only when the index contains the intended resolution

For YJZR data mapping conflicts, keep backend compatibility when both fields are plausible, such as `d.way ?? d.ways`, `d.MultArray || d.ma`, and `d.gm` handling.

## Commit Rules

Before committing:

- inspect `git status --short`
- inspect staged diff with `git diff --cached --stat` and targeted `git diff --cached`
- never use broad `git add .` in dirty Cocos repos unless the user explicitly wants all changes
- keep editor/profile noise, generated captures, and unrelated game files out of the commit
- run lightweight validation appropriate to the change, at minimum `git diff --check`

Commit message format:

```text
type(scope): concise summary
```

Use common types: `fix`, `feat`, `ci`, `docs`, `refactor`, `chore`, `test`. Omit scope when unclear or when the repo's nearby commits omit it. Use `[build]` only when the workflow intentionally needs a build-triggering commit.

## Push And Tag Rules

Never push unless the user explicitly asks in the current request. If a branch was rebased and diverges from its remote, explain the implication and prefer:

```bash
git push --force-with-lease
```

Use normal `git push` only when fast-forwardable.

YJZR has separate dev and staging packaging lanes. Do not use evidence from one lane to prove the other lane updated.

YJZR dev packaging contract:

- Workflow: `games/yjzr/.github/workflows/build-dev.yml`.
- Triggers: push to `main` or `ci-build` with a commit message containing `[build]`, or manual `workflow_dispatch` with the force-build input enabled.
- Common safe trigger when the current `main` worktree is dirty: create a temporary worktree/branch from the intended commit, create an empty commit like `chore(yjzr): trigger dev build [build]`, then push `ci-build:ci-build`. If `ci-build` is rewritten, use `git push --force-with-lease`.
- If a pushed commit does not contain `[build]`, the dev workflow may run and immediately skip; do not treat that as packaging.
- Verify Action page: `https://github.com/jp-sunshine/slot-fe-yjzr/actions/workflows/build-dev.yml`.
- Verify runtime: `https://dev-h5.au-slot.net/index.html?gameId=yjzr&dokomoii=enabled&operator_id=1&acc=&l=zh&codex_ts=<sha_or_time>`.
- Runtime proof requires the iframe/canvas to load, console to be checked, `gameConfig.json` to be reachable, and the deployed `index/application/settings/config` hashes to match a new build.

YJZR staging packaging contract:

- Workflow: `games/yjzr/.github/workflows/build-stg.yml`.
- Trigger: push a tag matching `stg-yjzr-{date:yyyymmdd}-{commit short SHA}`, for example `stg-yjzr-20260706-cb93f56`.
- Push target: `origin <tag>`.
- Verify Action page by tag: `https://github.com/jp-sunshine/slot-fe-yjzr/actions/workflows/build-stg.yml`.
- Verify runtime: `https://stg-h5.au-slot.net/index.html?gameId=yjzr&dokomoii=enabled&operator_id=1&acc=&l=zh&codex_ts=<tag_or_time>`.
- A successful `stg-yjzr-*` tag build proves only the staging lane. It does not update or prove `dev-h5.au-slot.net`.

If a YJZR packaging job fails at a Google Cloud authentication/upload step with a transient token error such as `Unable to retrieve Identity Pool subject token` or `upstream ... overflow`, rerun the failed job once before changing project files. If the same error repeats, classify it as CI/infrastructure unless logs show a project-side failure.

## Reference

For command recipes and verification checklists, read `references/git-workflows.md`.
