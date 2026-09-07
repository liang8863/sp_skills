param(
    [switch]$InventoryOnly
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillRoot = Split-Path -Parent $scriptRoot
$skillsRoot = Split-Path -Parent $skillRoot
$codexRoot = Split-Path -Parent $skillsRoot
$repoRoot = Split-Path -Parent $codexRoot
$gamesRoot = Join-Path $repoRoot 'games'
$serverRoot = Join-Path $gamesRoot 'Server'
$inspector = Join-Path $scriptRoot 'inspect-init-state.ps1'
$runnerGate = Join-Path $scriptRoot 'ensure-runner.ps1'
$runnerBaselineGate = Join-Path $scriptRoot 'inspect-server-baseline.ps1'
$projectInfoInitializer = Join-Path (Split-Path -Parent $skillRoot) 's-cli\scripts\initialize-project-info.ps1'
$hostExecutable = (Get-Process -Id $PID).Path
$testId = 'sinittest{0}' -f ([guid]::NewGuid().ToString('N'))
$nonTestId = 'sinittestbad{0}' -f ([guid]::NewGuid().ToString('N'))
$clientPath = Join-Path $gamesRoot "slot-fe-$testId"
$runnerPath = Join-Path $serverRoot "slot-be-runner-$testId"
$nonTestClientPath = Join-Path $gamesRoot "slot-fe-$nonTestId"
$nonTestRunnerPath = Join-Path $serverRoot "slot-be-runner-$nonTestId"
$expectedRemote = "git@github.com:jp-sunshine/slot-be-runner-$testId.git"
$cleanupPaths = [System.Collections.Generic.List[string]]::new()
$timeoutFixtureProcessIds = [System.Collections.Generic.List[int]]::new()

function Get-CanonicalPath([string]$Path) {
    return ([IO.Path]::GetFullPath($Path)).TrimEnd([char[]]@(
        [IO.Path]::DirectorySeparatorChar,
        [IO.Path]::AltDirectorySeparatorChar
    ))
}

function Assert-SafeCleanupPath([string]$Path) {
    $canonical = Get-CanonicalPath $Path
    $parent = Get-CanonicalPath (Split-Path -Parent $canonical)
    $leaf = Split-Path -Leaf $canonical
    $safeClient = $parent.Equals((Get-CanonicalPath $gamesRoot), [StringComparison]::OrdinalIgnoreCase) -and
        $leaf.StartsWith('slot-fe-sinittest', [StringComparison]::Ordinal)
    $safeServer = $parent.Equals((Get-CanonicalPath $serverRoot), [StringComparison]::OrdinalIgnoreCase) -and
        ($leaf.StartsWith('slot-be-runner-sinittest', [StringComparison]::Ordinal) -or
         $leaf.StartsWith('.s-init-test-', [StringComparison]::Ordinal))
    if (-not $safeClient -and -not $safeServer) {
        throw "Unsafe cleanup path: $canonical"
    }
}

function Remove-TestPath([string]$Path) {
    Assert-SafeCleanupPath $Path
    if (Test-Path -LiteralPath $Path -PathType Container) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    } elseif (Test-Path -LiteralPath $Path -PathType Leaf) {
        Remove-Item -LiteralPath $Path -Force
    }
}

function Invoke-Script([string]$Path, [string[]]$Arguments) {
    $previousErrorAction = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = @(& $hostExecutable -NoProfile -ExecutionPolicy Bypass -File $Path @Arguments 2>&1)
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorAction
    }
    $text = ($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    $json = $null
    try { $json = $text | ConvertFrom-Json } catch { }
    return [pscustomobject]@{ ExitCode = $exitCode; Text = $text; Json = $json }
}

function Assert-Status($Result, [int]$ExitCode, [string]$Status, [string]$Name) {
    if ($Result.ExitCode -ne $ExitCode -or $null -eq $Result.Json -or $Result.Json.status -ne $Status) {
        throw "$Name failed. Expected exit $ExitCode and status $Status. Output: $($Result.Text)"
    }
}

function Assert-Inventory($Result, [string]$Status, [string]$Name) {
    if ($Result.ExitCode -ne 0 -or $null -eq $Result.Json -or $Result.Json.overallStatus -ne $Status) {
        throw "$Name failed. Expected inventory $Status. Output: $($Result.Text)"
    }
}

function New-MinimalProjectPlan([string]$ReplicationId, [string]$ClientPath, [string]$RunnerPath) {
    return @"
# Test project plan

## 1. Identity and status

- schemaVersion: 1
- replicationId: $ReplicationId
- metadataGameId: game_102
- targetClient: $ClientPath
- targetServer: $RunnerPath
- projectInfo: doc/project_info.md
- scriptsRoot: doc/js_scripts
- resourceRoot: assets/resources/$($ReplicationId)_res
- competitorUrl: https://competitor.example/game
- serverState: UNKNOWN
- planState: DRAFT_EVIDENCE_GATED
- generatedAt: UNKNOWN
- clientGitBaseline: UNKNOWN
- serverGitBaseline: UNKNOWN

## 2. Scope and non-goals

This roadmap scopes evidence-gated client and server replication. It is neither an s_cli version 2 plan.json nor an accepted s_ser contract.

## 3. Evidence registry

| Evidence ID | Class | Relative source/artifact | Observation | Supports | Confidence | Limits |
| --- | --- | --- | --- | --- | --- | --- |
| E-1 | legacy-script | doc/js_scripts/archive.js | UNKNOWN | UNKNOWN | UNKNOWN | DRAFT |
| E-2 | local-resource | assets/resources/$($ReplicationId)_res/resource.dat | UNKNOWN | UNKNOWN | UNKNOWN | DRAFT |
| E-3 | competitor-runtime | doc/s_init/evidence/runtime.md | UNKNOWN | UNKNOWN | UNKNOWN | DRAFT |
| E-4 | project-info | doc/project_info.md | UNKNOWN | identity | confirmed | metadata only |
| E-5 | quick-reference | .codex/agents/s-cli-agent/references/slot-function-reference.md | UNKNOWN | coverage | confirmed | not behavior evidence |

## 4. Capability matrix

| Module | Capability | Observed behavior or UNKNOWN | Evidence IDs | Client gap | Server gap | Route (`s_cli`/`s_ser`/both/blocked) |
| --- | --- | --- | --- | --- | --- | --- |
| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| Bridge / host communication | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| Control / spin modes | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| GameService lifecycle | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| API / mapper / response contract | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| Event / state lifecycle | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| Reel / stop / drop / mask / layout | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| Performance orchestration | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| InfoBoard / status | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| Win / payout presentation | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| Big Win / Total Win | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| Free Game / Bonus | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| game-specific mechanics | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |
| Resource / Prefab / audio / animation | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |

## 5. Source-to-target mapping

| Map ID | Capability | Source behavior | Evidence IDs | Target client owner/candidate path | Target server producer/contract | Adaptation | Dependency/Gate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M-1 | UNKNOWN | UNKNOWN | E-1 | UNKNOWN | UNKNOWN | UNKNOWN | NEEDS_PROTOCOL_EVIDENCE | DRAFT |

## 6. Protocol and fixtures

| Flow/semantic field | Request/response shape, unit, null/omitted semantics | Client consumer and lifetime | Server producer | Evidence IDs | Raw/fixture artifact | Status |
| --- | --- | --- | --- | --- | --- | --- |
| UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | E-1 | UNKNOWN | DRAFT |

| Fixture ID | Scenario | Seed and provenance | Request | Expected frames/layout/state/amount | Raw response path | Runner test | Simulator/client replay | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-1 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DRAFT |

## 7. Client workstream

| Task ID | Scope | Prerequisites | Candidate target areas | Evidence IDs | Verification | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-1 | UNKNOWN | UNKNOWN | UNKNOWN | E-1 | UNKNOWN | UNKNOWN | DRAFT |

## 8. Server workstream

| Task ID | Scope (contract/rules/seeds/math/runtime) | Prerequisites | Candidate server area | Fixture output | Tests/simulator | Acceptance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S-1 | UNKNOWN | UNKNOWN | UNKNOWN | F-1 | UNKNOWN | UNKNOWN | DRAFT |

## 9. Dependency sequence

After roadmap validation, complete targeted competitor sampling and both detailed plans; then complete server identity, contract, fixtures, simulator, and coexistence acceptance before client identity and Reel work. Cross-end implementation does not run in parallel.

## 10. Acceptance matrix

| Acceptance ID | Layer | Scenario/fixture | Expected observable | Method/artifact | Status |
| --- | --- | --- | --- | --- | --- |
| A-1 | UNKNOWN | F-1 | UNKNOWN | UNKNOWN | DRAFT |

## 11. Unknowns and Gates

| Gate | Missing or contradictory evidence | Blocks | Allowed work | Exit criteria | Owner |
| --- | --- | --- | --- | --- | --- |
| NEEDS_LOCAL_REFERENCE | UNKNOWN | s_cli handoff | JS/runtime draft | resource files | s_cli |
| NEEDS_PROTOCOL_EVIDENCE | UNKNOWN | handoff | evidence collection | raw response | s_ser |

## 12. Task handoff

| Order | Task ID | Skill | Code repo/write scope | Document root | Evidence/fixtures | Depends on | Ready when | Deliverable | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S-1 | s_ser | UNKNOWN | doc | F-1 | UNKNOWN | evidence ready | contract | DRAFT |

## 13. Definition of done

The roadmap is complete when its evidence, Gates, and handoffs are reviewable without inferred competitor behavior. It authorizes targeted sampling and separate client/server detailed plans under references/detailed-plan-contract.md, not implementation; execution remains governed by references/execution-contract.md.
"@
}

$gitEnvironmentNames = @(
    'GIT_OPTIONAL_LOCKS',
    'S_INIT_TEST_MODE',
    'S_INIT_FAKE_GIT_LOG',
    'S_INIT_FAKE_GIT_READ_LOG',
    'S_INIT_FAKE_GIT_ORIGIN',
    'S_INIT_FAKE_GIT_CHILD_PID',
    'S_INIT_FAKE_GIT_DESCENDANT_SCRIPT',
    'S_INIT_FAKE_GIT_HOST'
)
$savedGitEnvironment = @{}
foreach ($name in $gitEnvironmentNames) {
    $savedGitEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
    foreach ($path in @($clientPath, $runnerPath, $nonTestClientPath, $nonTestRunnerPath)) {
        Assert-SafeCleanupPath $path
        if (Test-Path -LiteralPath $path) {
            throw "Test path already exists: $path"
        }
        $cleanupPaths.Add($path)
    }

    $resourcePath = Join-Path $clientPath "assets\resources\$($testId)_res"
    $docPath = Join-Path $clientPath 'doc'
    $scriptsPath = Join-Path $docPath 'js_scripts'
    $fakeGitPath = Join-Path $docPath 'fake-git.ps1'
    $fakePartialGitPath = Join-Path $docPath 'fake-git-partial.ps1'
    $fakeFailGitPath = Join-Path $docPath 'fake-git-fail.ps1'
    $fakeTimeoutGitPath = Join-Path $docPath 'fake-git-timeout.ps1'
    $fakeTimeoutDescendantPath = Join-Path $docPath 'fake-git-timeout-descendant.ps1'
    $fakeGitLog = Join-Path $docPath 'fake-git.log'
    $fakeGitReadLog = Join-Path $docPath 'fake-git-read.log'
    $fakeGitChildPid = Join-Path $docPath 'fake-git-child.pid'
    [IO.Directory]::CreateDirectory($resourcePath) | Out-Null
    [IO.Directory]::CreateDirectory($scriptsPath) | Out-Null
    [IO.File]::WriteAllText((Join-Path $resourcePath 'resource.dat'), 'resource evidence')
    [IO.File]::WriteAllText((Join-Path $scriptsPath 'archive.js'), 'window.testArchive = true;')
    [IO.File]::WriteAllText($fakeTimeoutDescendantPath, 'Start-Sleep -Seconds 30')
    $runtimeEvidencePath = Join-Path $docPath 's_init\evidence'
    [IO.Directory]::CreateDirectory($runtimeEvidencePath) | Out-Null
    [IO.File]::WriteAllText((Join-Path $runtimeEvidencePath 'runtime.md'), 'runtime evidence')
    $projectInfoPath = Join-Path $docPath 'project_info.md'
    $tick = [char]96
    $legacyProjectInfo = @"
# Project Info

- gameId: $($tick)game_102$($tick)
- competitorUrl: $($tick)https://competitor.example/game?token=secret$($tick)
- projectPath: $($clientPath -replace '\\', '/')
- targetProject: slot-fe-$testId
"@
    [IO.File]::WriteAllText($projectInfoPath, $legacyProjectInfo)

    $missingPlan = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $missingPlan 'NEEDS_PROJECT_PLAN_CREATION' 'missing project plan'
    if (@($missingPlan.Json.nextActions) -notcontains 'CREATE_PROJECT_PLAN' -or
        @($missingPlan.Json.nextActions) -contains 'CONFIRM_PROJECT_PLAN_CREATION') {
        throw "missing project plan did not report automatic creation: $($missingPlan.Text)"
    }
    if ($missingPlan.Json.replicationId -ne $testId -or
        $missingPlan.Json.metadataGameId -ne 'game_102' -or
        $missingPlan.Json.inputs.jsScripts.nonEmptyJavaScriptFiles -ne 1 -or
        $missingPlan.Json.inputs.projectInfo.redactedCompetitorUrl -match 'token=') {
        throw "inventory did not separate IDs, count scripts, or redact the URL: $($missingPlan.Text)"
    }

    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), '# Test plan')
    $invalidPlan = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $invalidPlan 'NEEDS_PROJECT_PLAN_REVIEW' 'invalid project plan'

    $planSections = @(
        '1. Identity and status',
        '2. Scope and non-goals',
        '3. Evidence registry',
        '4. Capability matrix',
        '5. Source-to-target mapping',
        '6. Protocol and fixtures',
        '7. Client workstream',
        '8. Server workstream',
        '9. Dependency sequence',
        '10. Acceptance matrix',
        '11. Unknowns and Gates',
        '12. Task handoff',
        '13. Definition of done'
    )
    $planShell = "# Test plan`r`n`r`n- schemaVersion: 1`r`n- replicationId: $testId`r`n`r`n"
    $planShell += (($planSections | ForEach-Object { "## $_`r`n`r`nTest.`r`n" }) -join "`r`n")
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $planShell)
    $shellPlan = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $shellPlan 'NEEDS_PROJECT_PLAN_REVIEW' 'headings plus Test shell plan'

    $validPlan = New-MinimalProjectPlan $testId $clientPath $runnerPath
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $validPlan)
    $ready = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $ready 'READY' 'ready inventory'
    if (@($ready.Json.nextActions) -notcontains 'PROJECT_PLAN_EXISTS') {
        throw "ready inventory did not report PROJECT_PLAN_EXISTS: $($ready.Text)"
    }

    $projectPlanPath = Join-Path $docPath 'project_plan.md'
    $fence = -join @($tick, $tick, $tick)
    [IO.File]::WriteAllText($projectPlanPath, "$fence`r`n$validPlan`r`n$fence")
    $fencedPlan = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $fencedPlan 'NEEDS_PROJECT_PLAN_REVIEW' 'fenced pseudo project plan'

    [IO.File]::WriteAllText($projectPlanPath, "<!--`r`n$validPlan`r`n-->")
    $commentedPlan = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $commentedPlan 'NEEDS_PROJECT_PLAN_REVIEW' 'HTML-commented pseudo project plan'

    $rawHtmlBlocks = @(
        [pscustomobject]@{ Name = 'script'; Open = '<SCRIPT type="text/plain">'; Close = '</SCRIPT>' },
        [pscustomobject]@{ Name = 'template'; Open = '<template data-test="plan">'; Close = '</template>' },
        [pscustomobject]@{ Name = 'pre'; Open = '<pre>'; Close = '</pre>' },
        [pscustomobject]@{ Name = 'style'; Open = '<style>'; Close = '</style>' }
    )
    foreach ($rawHtmlBlock in $rawHtmlBlocks) {
        [IO.File]::WriteAllText(
            $projectPlanPath,
            "$($rawHtmlBlock.Open)`r`n$validPlan`r`n$($rawHtmlBlock.Close)"
        )
        $rawHtmlPlan = Invoke-Script $inspector @('-ProjectPath', $clientPath)
        Assert-Inventory $rawHtmlPlan 'NEEDS_PROJECT_PLAN_REVIEW' "$($rawHtmlBlock.Name) raw HTML pseudo project plan"
    }

    $invalidCompetitorUrls = @(
        [pscustomobject]@{ Name = 'UNKNOWN competitor URL'; Value = 'UNKNOWN' },
        [pscustomobject]@{ Name = 'different competitor host'; Value = 'https://other.example/game' },
        [pscustomobject]@{ Name = 'different competitor path'; Value = 'https://competitor.example/other' },
        [pscustomobject]@{ Name = 'competitor URL userinfo'; Value = 'https://user@competitor.example/game' },
        [pscustomobject]@{ Name = 'competitor URL query'; Value = 'https://competitor.example/game?token=secret' },
        [pscustomobject]@{ Name = 'competitor URL fragment'; Value = 'https://competitor.example/game#state' }
    )
    foreach ($urlCase in $invalidCompetitorUrls) {
        $urlPlan = $validPlan.Replace(
            '- competitorUrl: https://competitor.example/game',
            "- competitorUrl: $($urlCase.Value)"
        )
        [IO.File]::WriteAllText($projectPlanPath, $urlPlan)
        $urlResult = Invoke-Script $inspector @('-ProjectPath', $clientPath)
        Assert-Inventory $urlResult 'NEEDS_PROJECT_PLAN_REVIEW' $urlCase.Name
    }

    $missingCanonicalModulePlan = [regex]::Replace(
        $validPlan,
        '(?m)^\| Bootstrap / Loading \|[^\r\n]*(?:\r?\n)?',
        ''
    )
    [IO.File]::WriteAllText($projectPlanPath, $missingCanonicalModulePlan)
    $missingCanonicalModule = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $missingCanonicalModule 'NEEDS_PROJECT_PLAN_REVIEW' 'missing canonical capability module'

    $wrongCaseModulePlan = $validPlan.Replace(
        '| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |',
        '| bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $wrongCaseModulePlan)
    $wrongCaseModule = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $wrongCaseModule 'NEEDS_PROJECT_PLAN_REVIEW' 'wrong-case canonical capability module'

    $unsupportedModulePlan = $validPlan.Replace(
        '| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |',
        "| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |`r`n| Arbitrary module | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |"
    )
    [IO.File]::WriteAllText($projectPlanPath, $unsupportedModulePlan)
    $unsupportedModule = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $unsupportedModule 'NEEDS_PROJECT_PLAN_REVIEW' 'unsupported capability module'

    $invalidCapabilityRoutePlan = $validPlan.Replace(
        '| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |',
        '| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | client |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $invalidCapabilityRoutePlan)
    $invalidCapabilityRoute = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $invalidCapabilityRoute 'NEEDS_PROJECT_PLAN_REVIEW' 'unsupported Capability route'

    $duplicateEvidencePlan = $validPlan.Replace(
        '| E-2 | local-resource |',
        '| E-1 | local-resource |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $duplicateEvidencePlan)
    $duplicateEvidence = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $duplicateEvidence 'NEEDS_PROJECT_PLAN_REVIEW' 'duplicate Evidence ID'

    foreach ($requiredClassCase in @(
        [pscustomobject]@{
            Name = 'missing project-info evidence'
            Pattern = '(?m)^\| E-4 \| project-info \|[^\r\n]*(?:\r?\n)?'
        },
        [pscustomobject]@{
            Name = 'missing quick-reference evidence'
            Pattern = '(?m)^\| E-5 \| quick-reference \|[^\r\n]*(?:\r?\n)?'
        }
    )) {
        $missingRequiredClassPlan = [regex]::Replace($validPlan, $requiredClassCase.Pattern, '')
        [IO.File]::WriteAllText($projectPlanPath, $missingRequiredClassPlan)
        $missingRequiredClass = Invoke-Script $inspector @('-ProjectPath', $clientPath)
        Assert-Inventory $missingRequiredClass 'NEEDS_PROJECT_PLAN_REVIEW' $requiredClassCase.Name
    }

    $noLegacyScriptPlan = [regex]::Replace(
        $validPlan,
        '(?m)^\| E-1 \| legacy-script \|[^\r\n]*(?:\r?\n)?',
        ''
    ).Replace(
        '| M-1 | UNKNOWN | UNKNOWN | E-1 |',
        '| M-1 | UNKNOWN | UNKNOWN | UNKNOWN |'
    ).Replace(
        '| UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | E-1 | UNKNOWN | DRAFT |',
        '| UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DRAFT |'
    ).Replace(
        '| C-1 | UNKNOWN | UNKNOWN | UNKNOWN | E-1 | UNKNOWN | UNKNOWN | DRAFT |',
        '| C-1 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DRAFT |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $noLegacyScriptPlan)
    $noLegacyScript = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $noLegacyScript 'NEEDS_PROJECT_PLAN_REVIEW' 'ready scripts without legacy-script evidence'

    $nonJavaScriptEvidencePath = Join-Path $scriptsPath 'archive.txt'
    [IO.File]::WriteAllText($nonJavaScriptEvidencePath, 'not JavaScript evidence')
    try {
        $nonJavaScriptEvidencePlan = $validPlan.Replace(
            'doc/js_scripts/archive.js',
            'doc/js_scripts/archive.txt'
        )
        [IO.File]::WriteAllText($projectPlanPath, $nonJavaScriptEvidencePlan)
        $nonJavaScriptEvidence = Invoke-Script $inspector @('-ProjectPath', $clientPath)
        Assert-Inventory $nonJavaScriptEvidence 'NEEDS_PROJECT_PLAN_REVIEW' 'legacy-script evidence with non-js extension'
    } finally {
        [IO.File]::Delete($nonJavaScriptEvidencePath)
    }

    $blankJavaScriptEvidencePath = Join-Path $scriptsPath 'blank.js'
    [IO.File]::WriteAllText($blankJavaScriptEvidencePath, " `r`n`t ")
    try {
        $blankJavaScriptEvidencePlan = $validPlan.Replace(
            'doc/js_scripts/archive.js',
            'doc/js_scripts/blank.js'
        )
        [IO.File]::WriteAllText($projectPlanPath, $blankJavaScriptEvidencePlan)
        $blankJavaScriptEvidence = Invoke-Script $inspector @('-ProjectPath', $clientPath)
        Assert-Inventory $blankJavaScriptEvidence 'NEEDS_PROJECT_PLAN_REVIEW' 'whitespace-only legacy-script evidence'
    } finally {
        [IO.File]::Delete($blankJavaScriptEvidencePath)
    }

    $noRuntimeEvidencePlan = [regex]::Replace(
        $validPlan,
        '(?m)^\| E-3 \| competitor-runtime \|[^\r\n]*(?:\r?\n)?',
        ''
    )
    [IO.File]::WriteAllText($projectPlanPath, $noRuntimeEvidencePlan)
    $noRuntimeEvidence = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $noRuntimeEvidence 'NEEDS_PROJECT_PLAN_REVIEW' 'missing runtime evidence without Gate'

    $runtimeEvidenceGatedDraftPlan = $noRuntimeEvidencePlan.Replace(
        '| NEEDS_PROTOCOL_EVIDENCE | UNKNOWN | handoff | evidence collection | raw response | s_ser |',
        "| NEEDS_PROTOCOL_EVIDENCE | UNKNOWN | handoff | evidence collection | raw response | s_ser |`r`n| NEEDS_RUNTIME_EVIDENCE | No captured competitor runtime | behavior confirmation | archive review | runtime capture | s_cli |"
    )
    [IO.File]::WriteAllText($projectPlanPath, $runtimeEvidenceGatedDraftPlan)
    $runtimeEvidenceGatedDraft = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $runtimeEvidenceGatedDraft 'READY' 'runtime-evidence-gated draft'

    $missingEvidenceReferencePlan = $validPlan.Replace(
        '| M-1 | UNKNOWN | UNKNOWN | E-1 |',
        '| M-1 | UNKNOWN | UNKNOWN | E-999 |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $missingEvidenceReferencePlan)
    $missingEvidenceReference = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $missingEvidenceReference 'NEEDS_PROJECT_PLAN_REVIEW' 'unregistered Evidence ID reference'

    $metadataOnlyBehaviorPlan = $validPlan.Replace(
        '| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |',
        '| Bootstrap / Loading | startup | Spin is available | E-4 | UNKNOWN | UNKNOWN | blocked |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $metadataOnlyBehaviorPlan)
    $metadataOnlyBehavior = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $metadataOnlyBehavior 'NEEDS_PROJECT_PLAN_REVIEW' 'metadata-only competitor behavior evidence'

    $requiredProseCases = @(
        [pscustomobject]@{
            Name = 'UNKNOWN Scope prose'
            Text = 'This roadmap scopes evidence-gated client and server replication. It is neither an s_cli version 2 plan.json nor an accepted s_ser contract.'
        },
        [pscustomobject]@{
            Name = 'UNKNOWN Dependency prose'
            Text = 'After roadmap validation, complete targeted competitor sampling and both detailed plans; then complete server identity, contract, fixtures, simulator, and coexistence acceptance before client identity and Reel work. Cross-end implementation does not run in parallel.'
        },
        [pscustomobject]@{
            Name = 'UNKNOWN Definition of Done prose'
            Text = 'The roadmap is complete when its evidence, Gates, and handoffs are reviewable without inferred competitor behavior. It authorizes targeted sampling and separate client/server detailed plans under references/detailed-plan-contract.md, not implementation; execution remains governed by references/execution-contract.md.'
        }
    )
    foreach ($proseCase in $requiredProseCases) {
        $unknownProsePlan = $validPlan.Replace($proseCase.Text, 'UNKNOWN')
        [IO.File]::WriteAllText($projectPlanPath, $unknownProsePlan)
        $unknownProse = Invoke-Script $inspector @('-ProjectPath', $clientPath)
        Assert-Inventory $unknownProse 'NEEDS_PROJECT_PLAN_REVIEW' $proseCase.Name
    }

    $metadataOnlyScopePlan = $validPlan.Replace(
        'This roadmap scopes evidence-gated client and server replication. It is neither an s_cli version 2 plan.json nor an accepted s_ser contract.',
        '- scope: UNKNOWN'
    )
    [IO.File]::WriteAllText($projectPlanPath, $metadataOnlyScopePlan)
    $metadataOnlyScope = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $metadataOnlyScope 'NEEDS_PROJECT_PLAN_REVIEW' 'metadata-only Scope prose'

    $invalidHandoffSkillPlan = $validPlan.Replace(
        '| 1 | S-1 | s_ser | UNKNOWN | doc |',
        '| 1 | S-1 | both | UNKNOWN | doc |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $invalidHandoffSkillPlan)
    $invalidHandoffSkill = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $invalidHandoffSkill 'NEEDS_PROJECT_PLAN_REVIEW' 'unsupported Task handoff Skill'

    $invalidDocumentRoots = @(
        '../Server/slot-be-runner-test/doc',
        'doc/../../Server/slot-be-runner-test/doc',
        (Join-Path $serverRoot 'slot-be-runner-test\doc'),
        'https://external.example/doc',
        'runner/doc'
    )
    foreach ($invalidDocumentRoot in $invalidDocumentRoots) {
        $invalidDocumentRootPlan = $validPlan.Replace(
            '| 1 | S-1 | s_ser | UNKNOWN | doc |',
            "| 1 | S-1 | s_ser | UNKNOWN | $invalidDocumentRoot |"
        )
        [IO.File]::WriteAllText($projectPlanPath, $invalidDocumentRootPlan)
        $invalidDocumentRootResult = Invoke-Script $inspector @('-ProjectPath', $clientPath)
        Assert-Inventory $invalidDocumentRootResult 'NEEDS_PROJECT_PLAN_REVIEW' "unsafe Task handoff Document root: $invalidDocumentRoot"
    }

    $nestedDocumentRootPlan = $validPlan.Replace(
        '| 1 | S-1 | s_ser | UNKNOWN | doc |',
        '| 1 | S-1 | s_ser | UNKNOWN | doc/s_init |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $nestedDocumentRootPlan)
    $nestedDocumentRoot = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $nestedDocumentRoot 'READY' 'project-relative nested Task handoff Document root'

    $readyPlan = $validPlan.Replace(
        '- planState: DRAFT_EVIDENCE_GATED',
        '- planState: READY_FOR_HANDOFF'
    ).Replace(
        '- clientGitBaseline: UNKNOWN',
        '- clientGitBaseline: client-abc123'
    ).Replace(
        '- serverGitBaseline: UNKNOWN',
        '- serverGitBaseline: server-def456'
    ).Replace(
        '| C-1 | UNKNOWN | UNKNOWN | UNKNOWN | E-1 | UNKNOWN | UNKNOWN | DRAFT |',
        '| C-1 | UNKNOWN | UNKNOWN | UNKNOWN | E-1 | UNKNOWN | UNKNOWN | READY |'
    ).Replace(
        '| S-1 | UNKNOWN | UNKNOWN | UNKNOWN | F-1 | UNKNOWN | UNKNOWN | DRAFT |',
        '| S-1 | UNKNOWN | UNKNOWN | UNKNOWN | F-1 | UNKNOWN | UNKNOWN | READY |'
    ).Replace(
        '| 1 | S-1 | s_ser | UNKNOWN | doc | F-1 | UNKNOWN | evidence ready | contract | DRAFT |',
        '| 1 | S-1 | s_ser | UNKNOWN | doc | F-1 | UNKNOWN | evidence ready | contract | READY |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $readyPlan)
    $readyWithNeedsGate = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $readyWithNeedsGate 'NEEDS_PROJECT_PLAN_REVIEW' 'ready plan with unresolved NEEDS Gate'

    $readyPlan = [regex]::Replace(
        $readyPlan,
        '(?m)^\| NEEDS_LOCAL_REFERENCE \|[^\r\n]*(?:\r?\n)?',
        ''
    )
    $readyPlan = [regex]::Replace(
        $readyPlan,
        '(?m)^\| NEEDS_PROTOCOL_EVIDENCE \|[^\r\n]*',
        '| NONE | No open evidence Gate | none | handoff | none | s_init |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $readyPlan)
    $fullyReady = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $fullyReady 'READY' 'fully resolved ready-for-handoff plan'

    [IO.File]::WriteAllText((Join-Path $scriptsPath 'archive.js'), " `r`n`t ")
    [IO.File]::WriteAllText($projectPlanPath, $readyPlan)
    $readyWithEmptyScripts = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $readyWithEmptyScripts 'NEEDS_JS_SCRIPTS' 'ready-for-handoff plan with empty scripts'
    if ($readyWithEmptyScripts.Json.inputs.projectPlan.status -ne 'NEEDS_REVIEW') {
        throw "READY_FOR_HANDOFF did not reject non-READY scripts: $($readyWithEmptyScripts.Text)"
    }
    [IO.File]::WriteAllText((Join-Path $scriptsPath 'archive.js'), 'window.testArchive = true;')

    $unknownBaselinePlan = $readyPlan.Replace(
        '- clientGitBaseline: client-abc123',
        '- clientGitBaseline: UNKNOWN'
    )
    [IO.File]::WriteAllText($projectPlanPath, $unknownBaselinePlan)
    $unknownBaseline = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $unknownBaseline 'NEEDS_PROJECT_PLAN_REVIEW' 'ready plan with UNKNOWN Git baseline'

    $invalidReadyStatuses = @(
        [pscustomobject]@{
            Name = 'ready plan with DRAFT client workstream'
            Ready = '| C-1 | UNKNOWN | UNKNOWN | UNKNOWN | E-1 | UNKNOWN | UNKNOWN | READY |'
            Invalid = '| C-1 | UNKNOWN | UNKNOWN | UNKNOWN | E-1 | UNKNOWN | UNKNOWN | DRAFT |'
        },
        [pscustomobject]@{
            Name = 'ready plan with BLOCKED server workstream'
            Ready = '| S-1 | UNKNOWN | UNKNOWN | UNKNOWN | F-1 | UNKNOWN | UNKNOWN | READY |'
            Invalid = '| S-1 | UNKNOWN | UNKNOWN | UNKNOWN | F-1 | UNKNOWN | UNKNOWN | BLOCKED |'
        },
        [pscustomobject]@{
            Name = 'ready plan with UNKNOWN task handoff'
            Ready = '| 1 | S-1 | s_ser | UNKNOWN | doc | F-1 | UNKNOWN | evidence ready | contract | READY |'
            Invalid = '| 1 | S-1 | s_ser | UNKNOWN | doc | F-1 | UNKNOWN | evidence ready | contract | UNKNOWN |'
        }
    )
    foreach ($statusCase in $invalidReadyStatuses) {
        $invalidReadyStatusPlan = $readyPlan.Replace($statusCase.Ready, $statusCase.Invalid)
        [IO.File]::WriteAllText($projectPlanPath, $invalidReadyStatusPlan)
        $invalidReadyStatus = Invoke-Script $inspector @('-ProjectPath', $clientPath)
        Assert-Inventory $invalidReadyStatus 'NEEDS_PROJECT_PLAN_REVIEW' $statusCase.Name
    }

    $wrongColumnCountPlan = $validPlan.Replace(
        '| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |',
        '| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $wrongColumnCountPlan)
    $wrongColumnCount = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $wrongColumnCount 'NEEDS_PROJECT_PLAN_REVIEW' 'table row with wrong column count'

    $emptyTableCellPlan = $validPlan.Replace(
        '| Bootstrap / Loading | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |',
        '| Bootstrap / Loading |  | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | blocked |'
    )
    [IO.File]::WriteAllText($projectPlanPath, $emptyTableCellPlan)
    $emptyTableCell = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $emptyTableCell 'NEEDS_PROJECT_PLAN_REVIEW' 'table row with empty cell'

    $readyResourceWithoutEvidencePlan = [regex]::Replace(
        $validPlan,
        '(?m)^\| E-2 \| local-resource \|[^\r\n]*(?:\r?\n)?',
        ''
    )
    [IO.File]::WriteAllText($projectPlanPath, $readyResourceWithoutEvidencePlan)
    $readyResourceWithoutEvidence = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $readyResourceWithoutEvidence 'NEEDS_PROJECT_PLAN_REVIEW' 'ready resource without local-resource evidence'

    $runtimeRoot = Join-Path $docPath 's_init'
    $runtimeLinkTarget = Join-Path $serverRoot ".s-init-test-runtime-$testId"
    Assert-SafeCleanupPath $runtimeLinkTarget
    if (Test-Path -LiteralPath $runtimeLinkTarget) {
        throw "Test path already exists: $runtimeLinkTarget"
    }
    $cleanupPaths.Add($runtimeLinkTarget)
    [IO.Directory]::CreateDirectory((Join-Path $runtimeLinkTarget 'evidence')) | Out-Null
    [IO.File]::WriteAllText((Join-Path $runtimeLinkTarget 'evidence\runtime.md'), 'runtime evidence')
    [IO.Directory]::Delete($runtimeRoot, $true)
    try {
        New-Item -ItemType Junction -Path $runtimeRoot -Target $runtimeLinkTarget | Out-Null
        [IO.File]::WriteAllText($projectPlanPath, $validPlan)
        $runtimeAncestorReparse = Invoke-Script $inspector @('-ProjectPath', $clientPath)
        Assert-Inventory $runtimeAncestorReparse 'NEEDS_PROJECT_PLAN_REVIEW' 'runtime evidence ancestor reparse point'
    } finally {
        if (Test-Path -LiteralPath $runtimeRoot) {
            $runtimeRootItem = Get-Item -LiteralPath $runtimeRoot -Force
            if (($runtimeRootItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) {
                throw "runtime reparse fixture unexpectedly became an ordinary directory: $runtimeRoot"
            }
            [IO.Directory]::Delete($runtimeRoot, $false)
        }
        [IO.Directory]::CreateDirectory($runtimeEvidencePath) | Out-Null
        [IO.File]::WriteAllText((Join-Path $runtimeEvidencePath 'runtime.md'), 'runtime evidence')
    }

    [IO.File]::WriteAllText($projectPlanPath, $validPlan)

    $outOfOrderPlan = $validPlan.Replace('## 2. Scope and non-goals', '## TEMP SECTION')
    $outOfOrderPlan = $outOfOrderPlan.Replace('## 3. Evidence registry', '## 2. Scope and non-goals')
    $outOfOrderPlan = $outOfOrderPlan.Replace('## TEMP SECTION', '## 3. Evidence registry')
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $outOfOrderPlan)
    $outOfOrder = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $outOfOrder 'NEEDS_PROJECT_PLAN_REVIEW' 'out-of-order plan sections'

    $missingIdentityPlan = [regex]::Replace(
        $validPlan,
        '(?m)^- targetServer:[^\r\n]*(?:\r?\n)?',
        ''
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $missingIdentityPlan)
    $missingIdentity = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $missingIdentity 'NEEDS_PROJECT_PLAN_REVIEW' 'missing Identity metadata'

    $emptyEvidencePlan = [regex]::Replace(
        $validPlan,
        '(?m)^\| E-[0-9]+ \|[^\r\n]*(?:\r?\n)?',
        ''
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $emptyEvidencePlan)
    $emptyEvidence = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $emptyEvidence 'NEEDS_PROJECT_PLAN_REVIEW' 'empty required table'

    $missingFixturePlan = [regex]::Replace(
        $validPlan,
        '(?ms)^\| Fixture ID \| Scenario \| Seed and provenance \|.*?(?=^## 7\. Client workstream)',
        ''
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $missingFixturePlan)
    $missingFixture = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $missingFixture 'NEEDS_PROJECT_PLAN_REVIEW' 'missing fixture table'

    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $validPlan)

    $targetServerMismatchPlan = $validPlan.Replace(
        "- targetServer: $runnerPath",
        "- targetServer: $(Join-Path $serverRoot 'slot-be-runner-other')"
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $targetServerMismatchPlan)
    $targetServerMismatch = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $targetServerMismatch 'NEEDS_PROJECT_PLAN_REVIEW' 'target server path mismatch'

    $targetClientMismatchPlan = $validPlan.Replace(
        "- targetClient: $clientPath",
        '- targetClient: D:\WorkSpace\slot-fe-client\games\slot-fe-other'
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $targetClientMismatchPlan)
    $targetClientMismatch = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $targetClientMismatch 'NEEDS_PROJECT_PLAN_REVIEW' 'target client path mismatch'

    $wrongCasePlan = $validPlan.Replace(
        "- replicationId: $testId",
        "- replicationId: $($testId.ToUpperInvariant())"
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $wrongCasePlan)
    $wrongCase = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $wrongCase 'NEEDS_PROJECT_PLAN_REVIEW' 'ordinal replication ID mismatch'

    $externalLocatorPlan = $validPlan.Replace(
        'doc/js_scripts/archive.js',
        'CC3Proj/other_UI/archive.js'
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $externalLocatorPlan)
    $externalLocator = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $externalLocator 'NEEDS_PROJECT_PLAN_REVIEW' 'external evidence locator'

    $absoluteUrlSourcePlan = $validPlan.Replace(
        'doc/js_scripts/archive.js',
        'https://competitor.example/archive.js'
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $absoluteUrlSourcePlan)
    $absoluteUrlSource = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $absoluteUrlSource 'NEEDS_PROJECT_PLAN_REVIEW' 'absolute URL evidence source'

    $noResourcePlan = [regex]::Replace(
        $validPlan,
        '(?m)^\| E-2 \| local-resource \|[^\r\n]*(?:\r?\n)?',
        ''
    )
    [IO.File]::Delete((Join-Path $resourcePath 'resource.dat'))
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $noResourcePlan)
    $emptyResource = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $emptyResource 'READY' 'empty local resource gated draft readiness'
    if ($emptyResource.Json.inputs.localResource.status -ne 'EMPTY' -or
        $emptyResource.Json.inputs.localResource.ordinaryFiles -ne 0 -or
        @($emptyResource.Json.nextActions) -notcontains 'RECORD_LOCAL_RESOURCE_GATE') {
        throw "empty local resource was not recorded as a non-blocking Gate: $($emptyResource.Text)"
    }

    $missingLocalGatePlan = [regex]::Replace(
        $noResourcePlan,
        '(?m)^\| NEEDS_LOCAL_REFERENCE \|[^\r\n]*(?:\r?\n)?',
        ''
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $missingLocalGatePlan)
    $missingLocalGate = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $missingLocalGate 'NEEDS_PROJECT_PLAN_REVIEW' 'missing local-resource Gate'

    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $validPlan)
    $falseLocalResource = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $falseLocalResource 'NEEDS_PROJECT_PLAN_REVIEW' 'empty resource declared as local evidence'

    $readyWithoutResourcePlan = $noResourcePlan.Replace(
        '- planState: DRAFT_EVIDENCE_GATED',
        '- planState: READY_FOR_HANDOFF'
    )
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $readyWithoutResourcePlan)
    $readyWithoutResource = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $readyWithoutResource 'NEEDS_PROJECT_PLAN_REVIEW' 'ready plan without local resources'

    [IO.Directory]::Delete($resourcePath)
    [IO.File]::WriteAllText((Join-Path $docPath 'project_plan.md'), $noResourcePlan)
    $missingResource = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $missingResource 'READY' 'missing local resource gated draft readiness'
    if ($missingResource.Json.inputs.localResource.status -ne 'MISSING' -or
        @($missingResource.Json.nextActions) -notcontains 'RECORD_LOCAL_RESOURCE_GATE') {
        throw "missing local resource was not recorded as a non-blocking Gate: $($missingResource.Text)"
    }

    [IO.File]::Delete($projectInfoPath)
    $initializedWithoutResource = Invoke-Script $projectInfoInitializer @(
        '-ProjectPath', $clientPath,
        '-CompetitorUrl', 'https://competitor.example/without-resource',
        '-AllowMissingResourceForSInit'
    )
    if ($initializedWithoutResource.ExitCode -ne 0 -or $initializedWithoutResource.Text -notmatch '^CREATED:') {
        throw "s_init project-info bootstrap could not record a missing resource Gate: $($initializedWithoutResource.Text)"
    }
    [IO.File]::WriteAllText($projectInfoPath, $legacyProjectInfo)

    [IO.File]::WriteAllText((Join-Path $scriptsPath 'archive.js'), " `r`n`t ")
    $emptyScripts = Invoke-Script $inspector @('-ProjectPath', $clientPath)
    Assert-Inventory $emptyScripts 'NEEDS_JS_SCRIPTS' 'blank JavaScript archive'
    [IO.File]::WriteAllText((Join-Path $scriptsPath 'archive.js'), 'window.testArchive = true;')

    if ($InventoryOnly) {
        Write-Output 'PASS: s_init inventory gates'
        return
    }

    $missingRunnerBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $missingRunnerBaseline 1 'NEEDS_SERVER_BASE_CODE' 'missing runner baseline'

    [IO.File]::WriteAllText($runnerPath, 'runner collision')
    $runnerFileBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $runnerFileBaseline 1 'INVALID' 'runner file baseline'
    Remove-TestPath $runnerPath

    [IO.Directory]::CreateDirectory($runnerPath) | Out-Null
    [IO.Directory]::CreateDirectory((Join-Path $runnerPath 'go.mod')) | Out-Null
    $directoryGoModBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $directoryGoModBaseline 1 'INVALID' 'directory go.mod baseline'
    Remove-TestPath $runnerPath

    [IO.Directory]::CreateDirectory($runnerPath) | Out-Null
    [IO.File]::WriteAllText((Join-Path $runnerPath 'go.mod'), "module example.test/slot-be-runner-donor`r`n`r`ngo 1.24`r`n")
    [IO.File]::WriteAllText((Join-Path $runnerPath 'scheme.json'), '{}')
    $missingEntrypointBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $missingEntrypointBaseline 1 'NEEDS_SERVER_BASE_CODE' 'missing startup entrypoint baseline'
    if ($missingEntrypointBaseline.Json.checks.goModule.status -ne 'READY' -or
        $missingEntrypointBaseline.Json.checks.configuration.status -ne 'READY' -or
        $missingEntrypointBaseline.Json.checks.startupEntrypoint.status -ne 'MISSING') {
        throw "baseline component checks did not explain the missing startup entrypoint: $($missingEntrypointBaseline.Text)"
    }

    [IO.Directory]::CreateDirectory((Join-Path $runnerPath 'cmd')) | Out-Null
    [IO.File]::WriteAllText((Join-Path $runnerPath 'cmd\main.go'), @"
package main

func main() {}
"@)
    $loneShellBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $loneShellBaseline 1 'NEEDS_SERVER_BASE_CODE' 'lone module startup configuration shell'
    if ($loneShellBaseline.Json.checks.gameRegistrationOrModule.status -ne 'MISSING') {
        throw "lone Go module, startup, and configuration shell incorrectly passed game/module evidence: $($loneShellBaseline.Text)"
    }

    [IO.Directory]::CreateDirectory((Join-Path $runnerPath 'internal')) | Out-Null
    [IO.File]::WriteAllText((Join-Path $runnerPath 'internal\version.go'), "package internal`r`n`r`nconst Version = `"0`"`r`n")
    $internalVersionBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $internalVersionBaseline 1 'NEEDS_SERVER_BASE_CODE' 'internal version shell'
    if ($internalVersionBaseline.Json.checks.gameRegistrationOrModule.status -ne 'MISSING') {
        throw "internal/version.go incorrectly passed game/module evidence: $($internalVersionBaseline.Text)"
    }

    [IO.Directory]::CreateDirectory((Join-Path $runnerPath 'generated\v1')) | Out-Null
    [IO.File]::WriteAllText((Join-Path $runnerPath 'generated\v1\generated.go'), @"
// Code generated by fixture. DO NOT EDIT.
package v1

type GeneratedGame struct{}
"@)
    $generatedGoBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $generatedGoBaseline 1 'NEEDS_SERVER_BASE_CODE' 'generated Go shell'
    if ($generatedGoBaseline.Json.checks.gameRegistrationOrModule.status -ne 'MISSING') {
        throw "generated Go source incorrectly passed game/module evidence: $($generatedGoBaseline.Text)"
    }

    [IO.File]::WriteAllText((Join-Path $runnerPath 'scheme.json'), " `r`n`t ")
    $blankConfigurationBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $blankConfigurationBaseline 1 'NEEDS_SERVER_BASE_CODE' 'blank configuration baseline'
    if ($blankConfigurationBaseline.Json.checks.configuration.status -ne 'MISSING') {
        throw "blank configuration file incorrectly passed baseline evidence: $($blankConfigurationBaseline.Text)"
    }
    [IO.File]::WriteAllText((Join-Path $runnerPath 'scheme.json'), '{}')

    [IO.File]::WriteAllText((Join-Path $runnerPath 'scheme.json'), '{ invalid json')
    $invalidJsonConfigurationBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $invalidJsonConfigurationBaseline 1 'NEEDS_SERVER_BASE_CODE' 'invalid JSON configuration baseline'
    if ($invalidJsonConfigurationBaseline.Json.checks.configuration.status -ne 'MISSING') {
        throw "invalid JSON configuration incorrectly passed baseline evidence: $($invalidJsonConfigurationBaseline.Text)"
    }

    [IO.File]::WriteAllText((Join-Path $runnerPath 'config.yaml'), '# placeholder only')
    $placeholderYamlConfigurationBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $placeholderYamlConfigurationBaseline 1 'NEEDS_SERVER_BASE_CODE' 'placeholder YAML configuration baseline'
    if ($placeholderYamlConfigurationBaseline.Json.checks.configuration.status -ne 'MISSING') {
        throw "placeholder YAML configuration incorrectly passed baseline evidence: $($placeholderYamlConfigurationBaseline.Text)"
    }
    [IO.File]::Delete((Join-Path $runnerPath 'config.yaml'))
    [IO.File]::WriteAllText((Join-Path $runnerPath 'scheme.json'), '{}')

    [IO.Directory]::CreateDirectory((Join-Path $runnerPath 'v1')) | Out-Null
    [IO.File]::WriteAllText((Join-Path $runnerPath 'cmd\main.go'), @"
package main

func main() {
    register("DONOR")
}
"@)
    [IO.File]::WriteAllText((Join-Path $runnerPath 'v1\donor.go'), "package donor`r`n`r`nfunc NewRunner() {}`r`n")
    $readyRunnerBaseline = Invoke-Script $runnerBaselineGate @('-ProjectPath', $clientPath)
    Assert-Status $readyRunnerBaseline 0 'READY' 'ready runner baseline'
    if ($readyRunnerBaseline.Json.buildExecuted -or $readyRunnerBaseline.Json.gameplayVerified -or
        $readyRunnerBaseline.Json.checks.gameRegistrationOrModule.status -ne 'READY') {
        throw "baseline readiness incorrectly implied build, gameplay, or target evidence: $($readyRunnerBaseline.Text)"
    }
    Remove-TestPath $runnerPath

    $fakeGit = @'
$gitArgs = @($args | ForEach-Object { [string]$_ })
if ($gitArgs.Count -gt 0 -and $gitArgs[0] -eq 'clone') {
    $logLines = [System.Collections.Generic.List[string]]::new()
    $logLines.Add("count=$($gitArgs.Count)")
    for ($index = 0; $index -lt $gitArgs.Count; $index++) {
        $logLines.Add("arg$($index + 1)=$($gitArgs[$index])")
    }
    $logLines.Add("gitTerminalPrompt=$env:GIT_TERMINAL_PROMPT")
    $logLines.Add("gitSshCommand=$env:GIT_SSH_COMMAND")
    $logLines.Add("gitOptionalLocks=$env:GIT_OPTIONAL_LOCKS")
    [IO.File]::WriteAllLines($env:S_INIT_FAKE_GIT_LOG, [string[]]$logLines)
    [IO.Directory]::CreateDirectory((Join-Path $gitArgs[3] '.git')) | Out-Null
    $global:LASTEXITCODE = 0
    return
}
if ($gitArgs.Count -ge 3 -and $gitArgs[0] -eq '-C') {
    [IO.File]::AppendAllLines($env:S_INIT_FAKE_GIT_READ_LOG, [string[]]@(
        "command=$($gitArgs[2]);gitOptionalLocks=$env:GIT_OPTIONAL_LOCKS"
    ))
    if ($gitArgs[2] -eq 'rev-parse') {
        Write-Output $gitArgs[1]
        $global:LASTEXITCODE = 0
        return
    }
    if ($gitArgs[2] -eq 'remote') {
        Write-Output $env:S_INIT_FAKE_GIT_ORIGIN
        $global:LASTEXITCODE = 0
        return
    }
    if ($gitArgs[2] -eq 'status') {
        $global:LASTEXITCODE = 0
        return
    }
}
$global:LASTEXITCODE = 8
'@
    $fakePartialGit = @'
$gitArgs = @($args | ForEach-Object { [string]$_ })
if ($gitArgs.Count -ge 3 -and $gitArgs[0] -eq '-C' -and $gitArgs[2] -eq 'rev-parse') {
    Write-Output $gitArgs[1]
    $global:LASTEXITCODE = 0
    return
}
if ($gitArgs.Count -gt 0 -and $gitArgs[0] -eq 'clone') {
    [IO.Directory]::CreateDirectory($gitArgs[3]) | Out-Null
    $global:LASTEXITCODE = 9
    return
}
$global:LASTEXITCODE = 8
'@
    $fakeFailGit = @'
$gitArgs = @($args | ForEach-Object { [string]$_ })
if ($gitArgs.Count -ge 3 -and $gitArgs[0] -eq '-C' -and $gitArgs[2] -eq 'rev-parse') {
    Write-Output $gitArgs[1]
    $global:LASTEXITCODE = 0
    return
}
if ($gitArgs.Count -gt 0 -and $gitArgs[0] -eq 'clone') {
    [Console]::Error.WriteLine('fatal: https://competitor.example/repo?token=secret-query access_token=secret-access')
    $global:LASTEXITCODE = 9
    return
}
$global:LASTEXITCODE = 8
'@
    $fakeTimeoutGit = @'
$gitArgs = @($args | ForEach-Object { [string]$_ })
if ($gitArgs.Count -ge 3 -and $gitArgs[0] -eq '-C' -and $gitArgs[2] -eq 'rev-parse') {
    Write-Output $gitArgs[1]
    $global:LASTEXITCODE = 0
    return
}
if ($gitArgs.Count -gt 0 -and $gitArgs[0] -eq 'clone') {
    [IO.Directory]::CreateDirectory($gitArgs[3]) | Out-Null
    $descendant = Start-Process -FilePath $env:S_INIT_FAKE_GIT_HOST -ArgumentList @(
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        $env:S_INIT_FAKE_GIT_DESCENDANT_SCRIPT
    ) -WindowStyle Hidden -PassThru
    [IO.File]::WriteAllLines($env:S_INIT_FAKE_GIT_CHILD_PID, [string[]]@(
        "root=$PID",
        "descendant=$($descendant.Id)"
    ))
    Start-Sleep -Seconds 30
    $global:LASTEXITCODE = 9
    return
}
$global:LASTEXITCODE = 8
'@
    [IO.File]::WriteAllText($fakeGitPath, $fakeGit)
    [IO.File]::WriteAllText($fakePartialGitPath, $fakePartialGit)
    [IO.File]::WriteAllText($fakeFailGitPath, $fakeFailGit)
    [IO.File]::WriteAllText($fakeTimeoutGitPath, $fakeTimeoutGit)
    $env:S_INIT_FAKE_GIT_LOG = $fakeGitLog
    $env:S_INIT_FAKE_GIT_READ_LOG = $fakeGitReadLog
    $env:S_INIT_FAKE_GIT_ORIGIN = $expectedRemote
    $env:S_INIT_FAKE_GIT_CHILD_PID = $fakeGitChildPid
    $env:S_INIT_FAKE_GIT_DESCENDANT_SCRIPT = $fakeTimeoutDescendantPath
    $env:S_INIT_FAKE_GIT_HOST = $hostExecutable
    [Environment]::SetEnvironmentVariable('GIT_OPTIONAL_LOCKS', 'test-sentinel', 'Process')

    [Environment]::SetEnvironmentVariable('S_INIT_TEST_MODE', $null, 'Process')
    $formalOverride = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $fakeGitPath)
    Assert-Status $formalOverride 1 'INVALID_TEST_HOOK' 'production Git override rejection'
    if ((Test-Path -LiteralPath $runnerPath) -or (Test-Path -LiteralPath $fakeGitLog)) {
        throw 'production Git override rejection executed the shim or created a runner'
    }

    [Environment]::SetEnvironmentVariable('S_INIT_TEST_MODE', '1', 'Process')
    $outsideDocOverride = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $hostExecutable)
    Assert-Status $outsideDocOverride 1 'INVALID_TEST_HOOK' 'outside-doc Git shim rejection'

    $nonFileOverride = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $docPath)
    Assert-Status $nonFileOverride 1 'INVALID_TEST_HOOK' 'non-file Git shim rejection'

    $nonTestDocPath = Join-Path $nonTestClientPath 'doc'
    [IO.Directory]::CreateDirectory($nonTestDocPath) | Out-Null
    $nonTestShimPath = Join-Path $nonTestDocPath 'fake-git.ps1'
    [IO.File]::WriteAllText($nonTestShimPath, $fakeGit)
    $nonTestOverride = Invoke-Script $runnerGate @('-ProjectPath', $nonTestClientPath, '-GitExecutable', $nonTestShimPath)
    Assert-Status $nonTestOverride 1 'INVALID_TEST_HOOK' 'non-sinittest Git override rejection'
    if (Test-Path -LiteralPath $nonTestRunnerPath) {
        throw 'non-sinittest Git override created a runner'
    }

    $invalidUrlInfo = $legacyProjectInfo.Replace(
        'https://competitor.example/game?token=secret',
        'not-an-absolute-url'
    )
    [IO.File]::WriteAllText($projectInfoPath, $invalidUrlInfo)
    $invalidUrl = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $fakeGitPath)
    Assert-Status $invalidUrl 1 'INVALID_PROJECT_INFO' 'invalid competitor URL clone gate'
    if ((Test-Path -LiteralPath $runnerPath) -or (Test-Path -LiteralPath $fakeGitLog)) {
        throw 'invalid competitor URL reached clone or created a runner'
    }

    $invalidGameIdInfo = $legacyProjectInfo.Replace('game_102', '../invalid')
    [IO.File]::WriteAllText($projectInfoPath, $invalidGameIdInfo)
    $invalidGameId = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $fakeGitPath)
    Assert-Status $invalidGameId 1 'INVALID_PROJECT_INFO' 'invalid gameId clone gate'
    if ((Test-Path -LiteralPath $runnerPath) -or (Test-Path -LiteralPath $fakeGitLog)) {
        throw 'invalid gameId reached clone or created a runner'
    }

    [IO.File]::WriteAllText($projectInfoPath, "$legacyProjectInfo`r`n- gameId: duplicate_game")
    $duplicateGameId = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $fakeGitPath)
    Assert-Status $duplicateGameId 1 'INVALID_PROJECT_INFO' 'duplicate gameId clone gate'
    if ((Test-Path -LiteralPath $runnerPath) -or (Test-Path -LiteralPath $fakeGitLog)) {
        throw 'duplicate gameId reached clone or created a runner'
    }

    [IO.File]::WriteAllText($projectInfoPath, "$legacyProjectInfo`r`n- competitorUrl: https://competitor.example/duplicate")
    $duplicateCompetitorUrl = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $fakeGitPath)
    Assert-Status $duplicateCompetitorUrl 1 'INVALID_PROJECT_INFO' 'duplicate competitor URL clone gate'
    if ((Test-Path -LiteralPath $runnerPath) -or (Test-Path -LiteralPath $fakeGitLog)) {
        throw 'duplicate competitor URL reached clone or created a runner'
    }
    [IO.File]::WriteAllText($projectInfoPath, $legacyProjectInfo)

    $dryRun = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-DryRun')
    Assert-Status $dryRun 0 'SERVER_CLONE_REQUIRED' 'missing runner dry run'
    $expectedDryRunCommand = @('git', 'clone', '--', $expectedRemote, $runnerPath)
    if ((Compare-Object -ReferenceObject $expectedDryRunCommand -DifferenceObject @($dryRun.Json.command) -SyncWindow 0).Count -ne 0) {
        throw "dry run did not expose the exact clone command: $($dryRun.Text)"
    }

    [IO.File]::WriteAllText($fakeGitReadLog, '')
    $cloned = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $fakeGitPath)
    Assert-Status $cloned 0 'SERVER_CLONE_OK' 'fake-git clone'
    if (-not (Test-Path -LiteralPath $runnerPath -PathType Container)) {
        throw 'successful clone did not create the runner destination'
    }
    $cloneArguments = @(Get-Content -LiteralPath $fakeGitLog)
    $expectedCloneArguments = @(
        'count=4',
        'arg1=clone',
        'arg2=--',
        "arg3=$expectedRemote",
        "arg4=$runnerPath",
        'gitTerminalPrompt=0',
        'gitSshCommand=ssh -o BatchMode=yes -o ConnectTimeout=15',
        'gitOptionalLocks=test-sentinel'
    )
    if ((Compare-Object -ReferenceObject $expectedCloneArguments -DifferenceObject $cloneArguments -SyncWindow 0).Count -ne 0) {
        throw "clone did not receive the exact arguments or non-interactive environment: $($cloneArguments -join '; ')"
    }
    $readGitCalls = @(Get-Content -LiteralPath $fakeGitReadLog | Where-Object { $_.Length -gt 0 })
    $expectedReadGitCalls = @(
        'command=rev-parse;gitOptionalLocks=0',
        'command=rev-parse;gitOptionalLocks=0',
        'command=remote;gitOptionalLocks=0',
        'command=status;gitOptionalLocks=0'
    )
    if ((Compare-Object -ReferenceObject $expectedReadGitCalls -DifferenceObject $readGitCalls -SyncWindow 0).Count -ne 0) {
        throw "read-only Git calls did not consistently disable optional locks: $($readGitCalls -join '; ')"
    }
    Remove-TestPath $runnerPath

    $env:S_INIT_FAKE_GIT_ORIGIN = 'git@github.com:jp-sunshine/slot-be-runner-other.git'
    $postCheckFailure = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $fakeGitPath)
    Assert-Status $postCheckFailure 3 'SERVER_CLONE_PARTIAL' 'post-clone origin gate'
    if (-not (Test-Path -LiteralPath $runnerPath -PathType Container)) {
        throw 'post-clone validation failure did not preserve the destination'
    }
    Remove-TestPath $runnerPath
    $env:S_INIT_FAKE_GIT_ORIGIN = $expectedRemote

    $partialClone = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $fakePartialGitPath)
    Assert-Status $partialClone 3 'SERVER_CLONE_PARTIAL' 'partial clone gate'
    Remove-TestPath $runnerPath

    $failedClone = Invoke-Script $runnerGate @('-ProjectPath', $clientPath, '-GitExecutable', $fakeFailGitPath)
    Assert-Status $failedClone 3 'SERVER_CLONE_FAILED' 'sanitized clone failure gate'
    if ($failedClone.Json.message -match 'secret-query|secret-access|CLIXML|<Objs' -or
        $failedClone.Json.message -notmatch [regex]::Escape('<redacted>')) {
        throw "clone failure output was not safely redacted: $($failedClone.Text)"
    }

    $timedOutClone = Invoke-Script $runnerGate @(
        '-ProjectPath', $clientPath,
        '-GitExecutable', $fakeTimeoutGitPath,
        '-CloneTimeoutSeconds', '2'
    )
    Assert-Status $timedOutClone 3 'SERVER_CLONE_PARTIAL' 'bounded clone timeout gate'
    if ($timedOutClone.Text -notmatch 'timed out after 2 seconds') {
        throw "clone timeout did not report its bounded deadline: $($timedOutClone.Text)"
    }
    if (-not (Test-Path -LiteralPath $fakeGitChildPid -PathType Leaf)) {
        throw 'timeout shim did not record its process ID'
    }
    $timedOutPids = @{}
    foreach ($pidLine in @(Get-Content -LiteralPath $fakeGitChildPid)) {
        if ($pidLine -notmatch '^(root|descendant)=(?<pid>[1-9][0-9]*)$') {
            throw "timeout shim recorded an invalid process identity: $pidLine"
        }
        $timedOutPids[$Matches[1]] = [int]$Matches['pid']
    }
    if ($timedOutPids.Count -ne 2 -or
        -not $timedOutPids.ContainsKey('root') -or
        -not $timedOutPids.ContainsKey('descendant')) {
        throw 'timeout shim did not record both root and descendant process IDs'
    }
    foreach ($processId in @($timedOutPids.Values)) {
        $timeoutFixtureProcessIds.Add([int]$processId)
    }
    foreach ($processId in @($timedOutPids.Values)) {
        if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
            throw "timed-out clone process remained alive: $processId"
        }
    }
    Remove-TestPath $runnerPath

    & git init -- $runnerPath *> $null
    if ($LASTEXITCODE -ne 0) { throw 'failed to initialize the existing-runner fixture' }
    & git -C $runnerPath remote add origin $expectedRemote
    if ($LASTEXITCODE -ne 0) { throw 'failed to add the expected test origin' }

    $existing = Invoke-Script $runnerGate @('-ProjectPath', $clientPath)
    Assert-Status $existing 0 'SERVER_REPO_READY' 'existing clean runner'

    [IO.File]::WriteAllText((Join-Path $runnerPath 'dirty.txt'), 'dirty')
    $dirty = Invoke-Script $runnerGate @('-ProjectPath', $clientPath)
    Assert-Status $dirty 0 'SERVER_REPO_READY_DIRTY' 'existing dirty runner'

    & git -C $runnerPath remote set-url origin 'git@github.com:jp-sunshine/slot-be-runner-other.git'
    if ($LASTEXITCODE -ne 0) { throw 'failed to alter the test origin' }
    $wrongOrigin = Invoke-Script $runnerGate @('-ProjectPath', $clientPath)
    Assert-Status $wrongOrigin 1 'SERVER_REPO_ORIGIN_MISMATCH' 'wrong origin gate'

    Remove-TestPath $runnerPath
    [IO.File]::WriteAllText($runnerPath, 'collision')
    $collision = Invoke-Script $runnerGate @('-ProjectPath', $clientPath)
    Assert-Status $collision 1 'SERVER_PATH_COLLISION' 'file collision gate'
    Remove-TestPath $runnerPath
} finally {
    foreach ($processId in $timeoutFixtureProcessIds) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        } catch {
        }
    }
    foreach ($name in $gitEnvironmentNames) {
        [Environment]::SetEnvironmentVariable($name, $savedGitEnvironment[$name], 'Process')
    }
    foreach ($path in $cleanupPaths) {
        Remove-TestPath $path
    }
}

foreach ($path in $cleanupPaths) {
    if (Test-Path -LiteralPath $path) { throw "Cleanup failed: $path" }
}
Write-Output 'PASS: s_init inventory and runner gates'
