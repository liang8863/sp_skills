# Git Workflow Recipes

## Safe Branch Rebase

1. Confirm repo identity and dirty state.
2. Save dirty work if needed:

```bash
git stash push -u -m "codex-before-<operation>-<date>"
```

3. Save the target branch:

```bash
git branch tmp_<target>_before_rebase_<source>_<date> <target>
```

4. Switch to the target and rebase:

```bash
git switch <target>
git rebase <source>
```

5. Validate:

```bash
git status --short --branch
git rev-list --left-right --count <source>...<target>
git log --oneline --decorate --graph -20
```

6. Restore stash if one was created:

```bash
git stash pop 'stash@{0}'
```

PowerShell requires quotes around `stash@{0}`.

## Pull With Rebase

```bash
git fetch --prune origin
git status --short --branch
git rev-list --left-right --count HEAD...@{u}
git rebase @{u}
```

If the branch is dirty, stash first and restore after rebase.

## Commit Checklist

Use targeted staging:

```bash
git add -- path/to/file-a path/to/file-b
```

Validate staged content:

```bash
git diff --cached --stat
git diff --cached -- path/to/file-a
git diff --check --cached
```

Commit:

```bash
git commit -m "fix(scope): concise summary"
```

If the commit should trigger the packaging workflow, include `[build]` only after confirming that behavior is desired:

```bash
git commit -m "fix: concise summary [build]"
```

## Graph Cleanup

When a branch graph has large crossing merge lines:

1. Create a backup branch.
2. Identify the intended source base and target replay range.
3. Prefer `git rebase --onto <new-base> <old-base> <target>`.
4. Compare the final tree with the backup:

```bash
git diff <backup> <target>
```

5. Explain any intentional tree differences.

## Push Rules

Fast-forward:

```bash
git push origin <branch>
```

After rebase:

```bash
git push --force-with-lease origin <branch>
```

Do not push without an explicit user request.

## YJZR Dev Build

Use this when the user asks to build or deploy the dev lane.

Trigger options:

- Push to `main` with a commit message containing `[build]`.
- Push to `ci-build` with a commit message containing `[build]`.
- Use the GitHub Actions manual `workflow_dispatch` path with force-build enabled.

When the current `main` worktree is dirty or the request is only to trigger a build, prefer a temporary worktree/branch so unrelated local files are not included:

```bash
git fetch origin ci-build
git worktree add --detach ../yjzr-ci-build <intended-sha-or-main>
git -C ../yjzr-ci-build switch -c ci-build
git -C ../yjzr-ci-build commit --allow-empty -m "chore(yjzr): trigger dev build [build]"
git -C ../yjzr-ci-build push --force-with-lease origin ci-build:ci-build
```

If the local branch already exists or the remote lease must be exact, inspect the current `origin/ci-build` SHA and use:

```bash
git push --force-with-lease=ci-build:<old-origin-ci-build-sha> origin ci-build:ci-build
```

Packaging interface:

- Workflow: `build-dev.yml`.
- GitHub Actions: `https://github.com/jp-sunshine/slot-fe-yjzr/actions/workflows/build-dev.yml`.
- Runtime URL: `https://dev-h5.au-slot.net/index.html?gameId=yjzr&dokomoii=enabled&operator_id=1&acc=&l=zh&codex_ts=<sha_or_time>`.
- Verify the deployed `/games/yjzr/index.html` resource chain: `index.<hash>.js -> application.<hash>.js -> settings.<hash>.json -> assets/resources/config.<hash>.json`.
- Confirm the page iframe/canvas loads and check console errors/warnings.
- A commit without `[build]` can create a skipped dev run; that is not a successful package.

## YJZR Staging Tag

```bash
git tag stg-yjzr-yyyymmdd-<short-sha> <sha>
git push origin stg-yjzr-yyyymmdd-<short-sha>
```

Use this only when the user asks to trigger the staging package.

Packaging interface:

- Workflow: `build-stg.yml`.
- Example tag: `stg-yjzr-20260706-cb93f56`.
- GitHub Actions: `https://github.com/jp-sunshine/slot-fe-yjzr/actions/workflows/build-stg.yml`.
- Runtime URL: `https://stg-h5.au-slot.net/index.html?gameId=yjzr&dokomoii=enabled&operator_id=1&acc=&l=zh&codex_ts=<tag_or_time>`.
- Check the Actions run for the pushed tag before validating the stg URL.
- Do not treat a successful `stg-yjzr-*` tag as proof that `dev-h5.au-slot.net` updated. Dev and stg are separate lanes.
