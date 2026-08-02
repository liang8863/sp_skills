# YJZR Packaging Pitfalls

Use this note before PM dispatches any YJZR packaging, GitHub Actions, build-trigger, deployment-cache, or online-runtime verification task.

## Core Rule

Do not treat a successful commit, tag push, or GitHub Action status as proof that the online game is correct. The gate is:

1. Workflow completed.
2. Deployed H5 entry points serve the expected new bundle hashes.
3. The changed Cocos resource exists in the deployed `config.<hash>.json`.
4. The actual `import/<prefix>/<pack>.<md5>.json` does not contain stale serialized data.
5. Runtime console has no target error after loading the dev/stg URL with a cache buster.

## Build Trigger Rules

- Dev packaging uses `build-dev.yml`. It is triggered by a push to `main` or `ci-build` only when the commit message contains `[build]`, or by manual `workflow_dispatch` with force-build enabled.
- If the user asks only to trigger a dev build and the local `main` worktree is dirty, prefer a temporary `ci-build` worktree/branch with an empty commit such as `chore(yjzr): trigger dev build [build]`; push with `--force-with-lease` when rewriting `ci-build`.
- A `main` push without `[build]` can produce a skipped dev workflow run. Do not count that as packaging.
- Staging packaging uses `build-stg.yml` and tag format `stg-yjzr-yyyymmdd-<short-sha>`.
- Push the staging tag only after the user asks to trigger staging packaging.
- `stg-yjzr-*` proves only the staging lane and should be verified on `stg-h5.au-slot.net`; it does not prove that `dev-h5.au-slot.net` changed.
- If GitHub repo access returns 404 through CLI/API, verify whether the context is unauthenticated. Use the already logged-in Chrome session or authenticated Git credentials.
- If a job fails during Google Cloud auth/upload with a transient token error such as `Unable to retrieve Identity Pool subject token` or `upstream ... overflow`, rerun the failed job once before changing project files.

## GitHub Workflow Pitfalls

- Replace copied `template` fields in `.github/workflows/**` with the real game name `yjzr`.
- Compare against `games/_run-slot-fe-msxrj` when diagnosing shared workflow behavior, but map paths back to YJZR instead of copying blindly.
- A Cocos fresh build error like `Build config not found: ... buildConfig_web-mobile.json` means the workflow expects a generated or checked-in build config at that path. Check workflow inputs, copied temp project layout, and `profiles/v2/packages/builder.json` before changing game code.
- Keep non-required `extensions/` plugins out of packaging commits. Extra editor plugins can change CI behavior or enlarge the copied Cocos project.
- Shared workflows may live in a private repo. Browser access may work while unauthenticated CLI requests show 404.

## Dependency Install Pitfalls

- `npm ERR! code EINTEGRITY` on a tarball, such as `color-convert-2.0.1.tgz`, is a dependency cache/registry integrity failure. Treat it differently from project code errors.
- `npm warn cleanup EPERM ... rmdir node_modules/...` on Windows runners is usually cleanup noise. Do not chase it first when the real failing line is `EINTEGRITY`.
- If install logs say "Dependencies installed successfully" but the step exits `1`, inspect the final npm error, not only the friendly log line.

## Cocos Resource Packaging Pitfalls

- Source files can be correct while the deployed Cocos resource pack is stale.
- The known failure pattern was runtime `TypeError: ... createEvaluator is not a function` because a deployed Animation component still contained a plain object like `{"clipName":"fs_vfx_g_screen"}` instead of an AnimationClip asset reference.
- Local `rg '"clipName"' assets` showing no bad prefab data is not enough. Verify the deployed `assets/resources/import/**.json` pack.
- If Cocos keeps reusing stale imported serialization, force reimport by changing the prefab asset UUID in the `.meta` and updating every prefab reference to the new UUID.
- For the 2026-07-07 YJZR case, `slow_drop_effect_player` moved from old compressed UUID `f2gWB4tClGqLcn4mqlmw1B` to new compressed UUID `7dYQtHgw1Eh4yPxnI9SYSU`; the verified deployed pack was `assets/resources/import/04/049c93b8b.cef0c.json`.

## Online Resource Verification Recipe

Use a cache buster on every request.

1. Fetch the host URL, for example:

```text
https://dev-h5.au-slot.net/index.html?gameId=yjzr&dokomoii=enabled&operator_id=1&acc=&l=zh&codex_ts=<sha_or_time>
```

For staging, use the staging host instead:

```text
https://stg-h5.au-slot.net/index.html?gameId=yjzr&dokomoii=enabled&operator_id=1&acc=&l=zh&codex_ts=<tag_or_time>
```

2. Fetch `/games/yjzr/index.html` and parse the real `index.<hash>.js`.
3. Fetch `application.<hash>.js` and parse `src/settings.<hash>.json`.
4. Read `settings.assets.bundleVers.resources`.
5. Fetch `/games/yjzr/assets/resources/config.<resourcesHash>.json`.
6. Locate the target path, such as `VFX/prefab/slow_drop_effect_player`.
7. Use the path id to find the containing pack in `config.packs`.
8. Resolve the pack md5 through `config.versions.import`.
9. Fetch the concrete pack URL and search for the stale marker, such as `"clipName":"fs_vfx_g_screen"`.

For the fixed YJZR deployment, both dev and stg served `assets/resources/config.102f3.json`, target id `1784`, compressed UUID `7dYQtHgw1Eh4yPxnI9SYSU`, and pack `049c93b8b.cef0c.json`.

## Browser And Tooling Pitfalls

- Chrome DevTools MCP can fail with `Transport closed`. Do not stop validation there.
- PowerShell `Invoke-WebRequest` can fail with TLS receive errors in this environment.
- `curl.exe` may inherit a local proxy and try `127.0.0.1:9`; use a different channel or bypass proxy.
- `node_repl` `fetch` can still validate public H5 resources when PowerShell/curl fail.
- Playwright may be installed without browser binaries. If launching Playwright fails with missing Chromium, either install browsers with approval or connect to an already launched system Chrome.
- System Chrome may need to be launched outside the sandbox with `--remote-debugging-port`, then connected through CDP.

## Runtime Error Classification

- `createEvaluator` or `clipName` errors are Cocos animation/resource serialization problems until proven otherwise.
- `HTTP 500` from empty test parameters such as blank `acc` can be backend/session data noise. Do not mix it with resource-pack validation.
- Main page canvas count can be `0` because the Cocos canvas is inside the `/games/yjzr/index.html` iframe. Count canvas inside frames before declaring the game blank.

## PM Gate Checklist

Before saying packaging is done, require evidence for:

- Trigger used: commit `[build]`, staging tag, or manual Action.
- Exact commit SHA and tag name, if any.
- Workflow URL or clear explanation why GitHub UI could not be accessed.
- Target lane: dev (`build-dev.yml` + `dev-h5`) or stg (`build-stg.yml` + `stg-h5`).
- Deployed `index/application/settings/config` hashes for the target lane.
- Target resource path, target id, compressed UUID, pack URL, and stale-marker search result.
- Runtime console result for the original error signature.
- Any unrelated residual errors, separated from the packaging fix.
