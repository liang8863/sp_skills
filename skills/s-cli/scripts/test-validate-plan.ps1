$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillRoot = Split-Path -Parent $scriptRoot
$skillsRoot = Split-Path -Parent $skillRoot
$codexRoot = Split-Path -Parent $skillsRoot
$repoRoot = Split-Path -Parent $codexRoot
$gamesRoot = Join-Path $repoRoot 'games'
$validator = Join-Path $scriptRoot 'validate-plan.ps1'
$template = Join-Path $skillRoot 'templates\plan.template.json'
$legacyV2Template = Join-Path $scriptRoot 'fixtures\legacy-v2-plan.fixture.json'
$hostExecutable = (Get-Process -Id $PID).Path
$testReplicationId = 'sclivalidator{0}' -f ([guid]::NewGuid().ToString('N'))
$testProjectName = "slot-fe-$testReplicationId"
$testProject = Join-Path $gamesRoot $testProjectName
$defaultMetadataGameId = 'provider_102'

function Get-CanonicalPath([string]$Path) {
    return ([IO.Path]::GetFullPath($Path)).TrimEnd([char[]]@([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar))
}

function Assert-SafeTestProject {
    $canonicalGamesRoot = Get-CanonicalPath $gamesRoot
    $canonicalTestProject = Get-CanonicalPath $testProject
    if (-not (Split-Path -Parent $canonicalTestProject).Equals($canonicalGamesRoot, [StringComparison]::OrdinalIgnoreCase) -or
        -not (Split-Path -Leaf $canonicalTestProject).StartsWith('slot-fe-sclivalidator', [StringComparison]::Ordinal)) {
        throw "Unsafe validator test project path: $canonicalTestProject"
    }
}

function Copy-TemplatePlan {
    return Get-Content -LiteralPath $template -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Write-TestPlan($Plan, [string]$Path) {
    $parent = Split-Path -Parent $Path
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    $Plan | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Invoke-PlanValidator([string]$Path, [switch]$SkipPathChecks, [switch]$AllowLegacyV1) {
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $validator, '-PlanPath', $Path)
    if ($SkipPathChecks) { $arguments += '-SkipPathChecks' }
    if ($AllowLegacyV1) { $arguments += '-AllowLegacyV1' }
    $previousErrorAction = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = (& $hostExecutable @arguments 2>&1 | Out-String)
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorAction
    }
    return [pscustomobject]@{
        ExitCode = $exitCode
        Output = $output
    }
}

function Assert-Valid($Result, [string]$Name) {
    if ($Result.ExitCode -ne 0) {
        throw "$Name was rejected unexpectedly: $($Result.Output)"
    }
    if ($Result.Output -notmatch '(?m)^VALID:') {
        throw "$Name did not emit VALID: $($Result.Output)"
    }
}

function Assert-Historical($Result, [string]$Name) {
    if ($Result.ExitCode -ne 0) {
        throw "$Name was rejected unexpectedly: $($Result.Output)"
    }
    if ($Result.Output -notmatch '(?m)^HISTORICAL_VALID_ONLY:' -or $Result.Output -match '(?m)^VALID:') {
        throw "$Name did not emit only HISTORICAL_VALID_ONLY: $($Result.Output)"
    }
}

function Assert-Invalid($Result, [string]$Name, [string]$ExpectedPattern) {
    if ($Result.ExitCode -eq 0) {
        throw "$Name was accepted unexpectedly: $($Result.Output)"
    }
    if ($Result.Output -notmatch $ExpectedPattern) {
        throw "$Name failed for the wrong reason. Expected '$ExpectedPattern': $($Result.Output)"
    }
}

function Reset-LocalReference(
    [switch]$MissingResource,
    [switch]$MissingScripts,
    [switch]$MissingProjectInfo,
    [string]$ProjectInfoGameId = 'provider_102',
    [string]$CompetitorUrl = 'https://example.test/demo'
) {
    $resourcePath = Join-Path $testProject "assets\resources\$($testReplicationId)_res"
    $scriptsPath = Join-Path $testProject 'doc\js_scripts'
    $projectInfoPath = Join-Path $testProject 'doc\project_info.md'
    foreach ($path in @($resourcePath, $scriptsPath, $projectInfoPath)) {
        if (Test-Path -LiteralPath $path) {
            Remove-Item -LiteralPath $path -Recurse -Force
        }
    }

    $targetScriptsPath = Join-Path $testProject 'assets\scripts'
    New-Item -ItemType Directory -Path $targetScriptsPath -Force | Out-Null
    'export class TargetController {}' | Set-Content -LiteralPath (Join-Path $targetScriptsPath 'TargetController.ts') -Encoding UTF8
    New-Item -ItemType Directory -Path (Join-Path $testProject 'doc') -Force | Out-Null
    if (-not $MissingResource) {
        New-Item -ItemType Directory -Path $resourcePath -Force | Out-Null
        '{}' | Set-Content -LiteralPath (Join-Path $resourcePath 'feature.prefab') -Encoding UTF8
    }
    if (-not $MissingScripts) {
        New-Item -ItemType Directory -Path $scriptsPath -Force | Out-Null
        'function feature() {}' | Set-Content -LiteralPath (Join-Path $scriptsPath 'SourceController.js') -Encoding UTF8
        '{}' | Set-Content -LiteralPath (Join-Path $scriptsPath 'SourceController.js.meta') -Encoding UTF8
    }
    if (-not $MissingProjectInfo) {
        @"
# Project Info

- gameId: $ProjectInfoGameId
- competitorUrl: $CompetitorUrl
"@ | Set-Content -LiteralPath $projectInfoPath -Encoding UTF8
    }
}

function New-LocalFixture(
    [string]$Name,
    [switch]$MissingResource,
    [switch]$MissingScripts,
    [switch]$MissingProjectInfo,
    [string]$ProjectInfoGameId = 'provider_102',
    [string]$CompetitorUrl = 'https://example.test/demo'
) {
    Reset-LocalReference `
        -MissingResource:$MissingResource `
        -MissingScripts:$MissingScripts `
        -MissingProjectInfo:$MissingProjectInfo `
        -ProjectInfoGameId $ProjectInfoGameId `
        -CompetitorUrl $CompetitorUrl

    $taskId = "20260906-$Name"
    $plan = Copy-TemplatePlan
    $plan.taskId = $taskId
    $plan.project = $testProject
    $plan.localReference.replicationId = $testReplicationId
    $plan.localReference.metadataGameId = $ProjectInfoGameId
    $plan.localReference.resourceRoot = "assets/resources/$($testReplicationId)_res"
    $plan.localReference.evidence[0].source = 'doc/js_scripts/SourceController.js#method'
    $plan.localReference.evidence[1].source = "assets/resources/$($testReplicationId)_res/feature.prefab"
    $plan.localReference.evidence[1].target = "assets/resources/$($testReplicationId)_res/feature.prefab"
    return [pscustomobject]@{
        Plan = $plan
        PlanPath = Join-Path $testProject "doc\s_cli\$taskId\plan.json"
    }
}

function New-LegacyV2Fixture([string]$Name) {
    Reset-LocalReference -ProjectInfoGameId $testReplicationId
    $taskId = "20260906-$Name"
    $projectValue = $testProject.Replace('\', '/')
    $planText = Get-Content -LiteralPath $legacyV2Template -Raw -Encoding UTF8
    $planText = $planText.Replace('__TASK_ID__', $taskId)
    $planText = $planText.Replace('__PROJECT__', $projectValue)
    $planText = $planText.Replace('__GAME_ID__', $testReplicationId)
    return [pscustomobject]@{
        Plan = $planText | ConvertFrom-Json
        PlanPath = Join-Path $testProject "doc\s_cli\$taskId\plan.json"
    }
}

function Save-And-Validate($Fixture, [switch]$AllowLegacyV1) {
    Write-TestPlan $Fixture.Plan $Fixture.PlanPath
    return Invoke-PlanValidator -Path $Fixture.PlanPath -AllowLegacyV1:$AllowLegacyV1
}

Assert-SafeTestProject
New-Item -ItemType Directory -Path $testProject -Force | Out-Null
try {
    Assert-Valid (Invoke-PlanValidator -Path $template -SkipPathChecks) 'version 2 template'

    $valid = New-LocalFixture 'valid'
    Write-TestPlan $valid.Plan $valid.PlanPath
    Assert-Valid (Invoke-PlanValidator -Path $valid.PlanPath) 'valid local-reference plan'
    Assert-Invalid (Invoke-PlanValidator -Path $valid.PlanPath -SkipPathChecks) 'SkipPathChecks on a task plan' 'reserved for the canonical s-cli plan template'

    $legacyGameIdAlias = New-LegacyV2Fixture 'legacy-game-id-alias'
    Assert-Valid (Save-And-Validate $legacyGameIdAlias) 'independent legacy version 2 localReference.gameId fixture'

    $legacyMetadataMismatch = New-LegacyV2Fixture 'legacy-metadata-mismatch'
    @"
# Project Info

- gameId: provider_legacy
- competitorUrl: https://example.test/demo
"@ | Set-Content -LiteralPath (Join-Path $testProject 'doc\project_info.md') -Encoding UTF8
    Assert-Invalid (Save-And-Validate $legacyMetadataMismatch) 'legacy gameId differing from project_info gameId' 'migrate the plan to replicationId \+ metadataGameId'

    $legacySlugMismatch = New-LegacyV2Fixture 'legacy-slug-mismatch'
    $legacySlugMismatch.Plan.localReference.gameId = 'provider_legacy'
    Assert-Invalid (Save-And-Validate $legacySlugMismatch) 'legacy gameId differing from project slug' 'must exactly match the target project slug'

    $mixedLegacyAlias = New-LocalFixture 'mixed-legacy-alias'
    $mixedLegacyAlias.Plan.localReference | Add-Member -MemberType NoteProperty -Name gameId -Value $defaultMetadataGameId
    Assert-Invalid (Save-And-Validate $mixedLegacyAlias) 'current identity fields mixed with legacy gameId' 'identity must use either'

    $partialLegacyAlias = New-LocalFixture 'partial-legacy-alias'
    $partialLegacyAlias.Plan.localReference.PSObject.Properties.Remove('metadataGameId')
    $partialLegacyAlias.Plan.localReference | Add-Member -MemberType NoteProperty -Name gameId -Value $defaultMetadataGameId
    Assert-Invalid (Save-And-Validate $partialLegacyAlias) 'partial current identity mixed with legacy gameId' 'identity must use either'

    $wrongReplicationId = New-LocalFixture 'wrong-replication-id'
    $wrongReplicationId.Plan.localReference.replicationId = 'other'
    Assert-Invalid (Save-And-Validate $wrongReplicationId) 'replicationId differing from project slug' 'must match the target project slug'

    $wrongCaseReplicationId = New-LocalFixture 'wrong-case-replication-id'
    $wrongCaseReplicationId.Plan.localReference.replicationId = $testReplicationId.ToUpperInvariant()
    Assert-Invalid (Save-And-Validate $wrongCaseReplicationId) 'replicationId casing differing from project slug' 'ordinal-exact casing'

    $metadataResourceRoot = New-LocalFixture 'metadata-resource-root'
    $metadataResourceRoot.Plan.localReference.resourceRoot = "assets/resources/$($defaultMetadataGameId)_res"
    Assert-Invalid (Save-And-Validate $metadataResourceRoot) 'metadataGameId-derived resource root' 'localReference.resourceRoot must be the project-relative path'

    $wrongLocation = New-LocalFixture 'wrong-location'
    $wrongLocation.PlanPath = Join-Path $testProject 'plan.json'
    Assert-Invalid (Save-And-Validate $wrongLocation) 'plan outside doc/s_cli task directory' 'Version 2 plan must be under'

    $wrongTaskDirectory = New-LocalFixture 'wrong-task-directory'
    $wrongTaskDirectory.PlanPath = Join-Path $testProject 'doc\s_cli\different-task-id\plan.json'
    Assert-Invalid (Save-And-Validate $wrongTaskDirectory) 'taskId and task directory mismatch' 'taskId must match the plan directory name'

    $externalProject = New-LocalFixture 'external-project'
    $externalProject.Plan.project = Join-Path $repoRoot 'CC3Proj\demo_UI'
    Assert-Invalid (Save-And-Validate $externalProject) 'external resource project' 'plan.project must canonically equal the target derived from PlanPath'

    $otherTargetProject = New-LocalFixture 'other-target-project'
    $otherTargetProject.Plan.project = Join-Path $gamesRoot 'some-other-game'
    Assert-Invalid (Save-And-Validate $otherTargetProject) 'other target project' 'plan.project must canonically equal the target derived from PlanPath'

    $missingResource = New-LocalFixture 'missing-resource' -MissingResource
    Assert-Invalid (Save-And-Validate $missingResource) 'missing resource root' 'Local competitor resource directory does not exist'

    $emptyResource = New-LocalFixture 'empty-resource'
    Remove-Item -LiteralPath (Join-Path $testProject "assets\resources\$($testReplicationId)_res\feature.prefab") -Force
    Assert-Invalid (Save-And-Validate $emptyResource) 'empty resource root' 'Local competitor resource directory is empty'

    $missingScripts = New-LocalFixture 'missing-scripts' -MissingScripts
    Assert-Invalid (Save-And-Validate $missingScripts) 'missing scripts root' 'Local competitor script directory does not exist'

    $missingProjectInfo = New-LocalFixture 'missing-project-info' -MissingProjectInfo
    Assert-Invalid (Save-And-Validate $missingProjectInfo) 'missing project info' 'Local project info file does not exist'

    $mismatchedGameId = New-LocalFixture 'mismatched-game-id' -ProjectInfoGameId 'other'
    $mismatchedGameId.Plan.localReference.metadataGameId = $defaultMetadataGameId
    Assert-Invalid (Save-And-Validate $mismatchedGameId) 'mismatched gameId' 'does not match localReference.metadataGameId'

    $duplicateGameId = New-LocalFixture 'duplicate-game-id'
    Add-Content -LiteralPath (Join-Path $testProject 'doc\project_info.md') -Value "- gameId: $defaultMetadataGameId" -Encoding UTF8
    Assert-Invalid (Save-And-Validate $duplicateGameId) 'duplicate project_info gameId' 'must define gameId exactly once'

    $duplicateCompetitorUrl = New-LocalFixture 'duplicate-competitor-url'
    Add-Content -LiteralPath (Join-Path $testProject 'doc\project_info.md') -Value '- competitorUrl: https://example.test/duplicate' -Encoding UTF8
    Assert-Invalid (Save-And-Validate $duplicateCompetitorUrl) 'duplicate project_info competitorUrl' 'must define competitorUrl exactly once'

    $invalidUrl = New-LocalFixture 'invalid-url' -CompetitorUrl 'relative/url'
    Assert-Invalid (Save-And-Validate $invalidUrl) 'invalid competitor URL' 'competitorUrl must be an absolute HTTP'

    $externalRoot = New-LocalFixture 'external-root'
    $externalRoot.Plan.localReference.resourceRoot = 'D:/external/demo_res'
    Assert-Invalid (Save-And-Validate $externalRoot) 'external resource root' 'localReference.resourceRoot must be the project-relative path'

    $externalEvidence = New-LocalFixture 'external-evidence'
    $externalEvidence.Plan.localReference.evidence[0].source = 'D:/external/SourceController.js#method'
    Assert-Invalid (Save-And-Validate $externalEvidence) 'external evidence source' 'evidence source must be project-relative'

    $externalServerRawResponse = New-LocalFixture 'external-server-raw-response'
    $externalServerRawResponse.Plan.serverDataCheck.rawResponse = 'CC3Proj/demo_UI/raw-response.json'
    Assert-Invalid (Save-And-Validate $externalServerRawResponse) 'external server raw response' 'serverDataCheck.rawResponse cannot cite an external resource-project locator'

    $externalServerEvidence = New-LocalFixture 'external-server-evidence'
    $externalServerEvidence.Plan.serverDataCheck.evidence[0].source = 'https://competitor.example/raw-response.json'
    Assert-Invalid (Save-And-Validate $externalServerEvidence) 'external server evidence source' 'serverDataCheck.evidence.source cannot cite an external resource-project locator'

    $missingServerRawResponse = New-LocalFixture 'missing-server-raw-response'
    $missingServerRawResponse.Plan.serverDataCheck.rawResponse = 'doc/s_cli/missing/raw-response.json'
    Assert-Invalid (Save-And-Validate $missingServerRawResponse) 'missing target-relative server raw response' 'serverDataCheck.rawResponse must reference an existing regular file'

    $missingServerEvidence = New-LocalFixture 'missing-server-evidence'
    $missingServerEvidence.Plan.serverDataCheck.evidence[0].source = 'doc/s_cli/missing/server-evidence.json'
    Assert-Invalid (Save-And-Validate $missingServerEvidence) 'missing target-relative server evidence source' 'serverDataCheck.evidence.source must reference an existing regular file'

    $localServerEvidence = New-LocalFixture 'local-server-evidence'
    $localServerArtifact = Join-Path (Split-Path -Parent $localServerEvidence.PlanPath) 'raw-response.json'
    New-Item -ItemType Directory -Path (Split-Path -Parent $localServerArtifact) -Force | Out-Null
    '{}' | Set-Content -LiteralPath $localServerArtifact -Encoding UTF8
    $localServerEvidence.Plan.serverDataCheck.rawResponse = 'doc/s_cli/20260906-local-server-evidence/raw-response.json'
    $localServerEvidence.Plan.serverDataCheck.evidence[0].source = 'doc/s_cli/20260906-local-server-evidence/raw-response.json#response'
    Assert-Valid (Save-And-Validate $localServerEvidence) 'existing target-relative server evidence'

    $resourceReparse = New-LocalFixture 'resource-reparse'
    $resourceLinkTarget = Join-Path $testProject '__resource_link_target'
    $resourceLink = Join-Path $testProject "assets\resources\$($testReplicationId)_res\linked"
    New-Item -ItemType Directory -Path $resourceLinkTarget -Force | Out-Null
    $resourceLinkCreated = $false
    try {
        New-Item -ItemType Junction -Path $resourceLink -Target $resourceLinkTarget -Force | Out-Null
        $resourceLinkCreated = $true
        Assert-Invalid (Save-And-Validate $resourceReparse) 'nested resource reparse' 'resource directory cannot contain a reparse point'
    } catch {
        if ($resourceLinkCreated) { throw }
        Write-Output "SKIP: nested resource reparse test unavailable: $($_.Exception.Message)"
    } finally {
        if (Test-Path -LiteralPath $resourceLink) { [IO.Directory]::Delete($resourceLink) }
    }

    $scriptsReparse = New-LocalFixture 'scripts-reparse'
    $scriptsLinkTarget = Join-Path $testProject '__scripts_link_target'
    $scriptsLink = Join-Path $testProject 'doc\js_scripts\linked'
    New-Item -ItemType Directory -Path $scriptsLinkTarget -Force | Out-Null
    $scriptsLinkCreated = $false
    try {
        New-Item -ItemType Junction -Path $scriptsLink -Target $scriptsLinkTarget -Force | Out-Null
        $scriptsLinkCreated = $true
        Assert-Invalid (Save-And-Validate $scriptsReparse) 'nested scripts reparse' 'script directory cannot contain a reparse point'
    } catch {
        if ($scriptsLinkCreated) { throw }
        Write-Output "SKIP: nested scripts reparse test unavailable: $($_.Exception.Message)"
    } finally {
        if (Test-Path -LiteralPath $scriptsLink) { [IO.Directory]::Delete($scriptsLink) }
    }

    $serverEvidenceReparse = New-LocalFixture 'server-evidence-reparse'
    $serverEvidenceTarget = Join-Path $testProject '__server_evidence_link_target'
    $serverEvidenceLink = Join-Path $testProject 'doc\server-evidence-link'
    New-Item -ItemType Directory -Path $serverEvidenceTarget -Force | Out-Null
    '{}' | Set-Content -LiteralPath (Join-Path $serverEvidenceTarget 'raw-response.json') -Encoding UTF8
    $serverEvidenceLinkCreated = $false
    try {
        New-Item -ItemType Junction -Path $serverEvidenceLink -Target $serverEvidenceTarget -Force | Out-Null
        $serverEvidenceLinkCreated = $true
        $serverEvidenceReparse.Plan.serverDataCheck.rawResponse = 'doc/server-evidence-link/raw-response.json'
        Assert-Invalid (Save-And-Validate $serverEvidenceReparse) 'server evidence below reparse point' 'serverDataCheck.rawResponse cannot traverse a reparse point'
    } catch {
        if ($serverEvidenceLinkCreated) { throw }
        Write-Output "SKIP: server evidence reparse test unavailable: $($_.Exception.Message)"
    } finally {
        if (Test-Path -LiteralPath $serverEvidenceLink) { [IO.Directory]::Delete($serverEvidenceLink) }
    }

    $absoluteRootCauseEvidence = New-LocalFixture 'absolute-root-cause-evidence'
    $absoluteRootCauseEvidence.Plan.rootCause.evidence[0].source = 'D:/outside/evidence.js#method'
    Assert-Invalid (Save-And-Validate $absoluteRootCauseEvidence) 'absolute root-cause evidence source' 'rootCause.evidence.source cannot cite an external resource-project locator'

    $cc3RootCauseEvidence = New-LocalFixture 'cc3-root-cause-evidence'
    $cc3RootCauseEvidence.Plan.rootCause.evidence[0].source = 'CC3Proj/demo/assets/SourceController.js#method'
    Assert-Invalid (Save-And-Validate $cc3RootCauseEvidence) 'CC3Proj root-cause evidence source' 'rootCause.evidence.source cannot cite an external resource-project locator'

    $siblingGameRootCauseEvidence = New-LocalFixture 'sibling-game-root-cause-evidence'
    $siblingGameRootCauseEvidence.Plan.rootCause.evidence[0].source = 'games/slot-fe-other/assets/scripts/SourceController.ts#method'
    Assert-Invalid (Save-And-Validate $siblingGameRootCauseEvidence) 'games sibling root-cause evidence source' 'rootCause.evidence.source cannot cite an external resource-project locator'

    $siblingGameRoutingEvidence = New-LocalFixture 'sibling-game-routing-evidence'
    $siblingGameRoutingEvidence.Plan.analysisRouting.evidence = @('slot-fe-other/assets/scripts/SourceController.ts#method')
    Assert-Invalid (Save-And-Validate $siblingGameRoutingEvidence) 'relative sibling game routing evidence source' 'analysisRouting.evidence cannot cite an external resource-project locator'

    $siblingUiRoutingEvidence = New-LocalFixture 'sibling-ui-routing-evidence'
    $siblingUiRoutingEvidence.Plan.analysisRouting.evidence = @('demo_UI/assets/scripts/SourceController.js#method')
    Assert-Invalid (Save-And-Validate $siblingUiRoutingEvidence) 'sibling UI routing evidence source' 'analysisRouting.evidence cannot cite an external resource-project locator'

    $resourceProjectRoutingEvidence = New-LocalFixture 'resource-project-routing-evidence'
    $resourceProjectRoutingEvidence.Plan.analysisRouting.evidence = @('resource-project/assets/scripts/SourceController.js#method')
    Assert-Invalid (Save-And-Validate $resourceProjectRoutingEvidence) 'resource-project routing evidence source' 'analysisRouting.evidence cannot cite an external resource-project locator'

    $descriptiveEvidence = New-LocalFixture 'descriptive-evidence'
    $descriptiveEvidence.Plan.rootCause.evidence[0].source = 'Runtime observation without a filesystem locator'
    $descriptiveEvidence.Plan.analysisRouting.evidence = @('The resource-project dependency is absent; this is routing rationale, not a source path')
    Assert-Valid (Save-And-Validate $descriptiveEvidence) 'non-path descriptive evidence'

    $existingRootCauseFile = New-LocalFixture 'existing-root-cause-file'
    $existingRootCauseFile.Plan.rootCause.evidence[0].source = 'assets/scripts/TargetController.ts#method'
    Assert-Valid (Save-And-Validate $existingRootCauseFile) 'existing target-relative root-cause file'

    $missingRootCauseFile = New-LocalFixture 'missing-root-cause-file'
    $missingRootCauseFile.Plan.rootCause.evidence[0].source = 'assets/scripts/MissingController.ts#method'
    Assert-Invalid (Save-And-Validate $missingRootCauseFile) 'missing target-relative root-cause file' 'must reference an existing regular file'

    $traversalEvidence = New-LocalFixture 'traversal-evidence'
    $traversalEvidence.Plan.localReference.evidence[0].source = 'doc/js_scripts/../project_info.md'
    Assert-Invalid (Save-And-Validate $traversalEvidence) 'traversing evidence source' 'evidence source must be project-relative'

    $missingEvidenceSource = New-LocalFixture 'missing-evidence-source'
    $missingEvidenceSource.Plan.localReference.evidence[0].source = 'doc/js_scripts/MissingController.js#method'
    Assert-Invalid (Save-And-Validate $missingEvidenceSource) 'missing local evidence source' 'Local competitor evidence source must be an existing regular file'

    $directoryResourceEvidence = New-LocalFixture 'directory-resource-evidence'
    $directoryResourceEvidence.Plan.localReference.evidence[1].source = "assets/resources/$($testReplicationId)_res"
    Assert-Invalid (Save-And-Validate $directoryResourceEvidence) 'resource directory masquerading as evidence' 'Local competitor evidence source must be an existing regular file'

    $metaLegacyEvidence = New-LocalFixture 'meta-legacy-evidence'
    $metaLegacyEvidence.Plan.localReference.evidence[0].source = 'doc/js_scripts/SourceController.js.meta#method'
    Assert-Invalid (Save-And-Validate $metaLegacyEvidence) 'meta file masquerading as legacy script' 'Legacy-script evidence source must be a JavaScript file ending in .js'

    $metadataOnly = New-LocalFixture 'metadata-only'
    $metadataOnly.Plan.localReference.evidence = @(
        [pscustomobject]@{
            kind = 'project-info'
            source = 'doc/project_info.md'
            target = 'doc/project_info.md'
            behavior = 'Metadata only'
            adaptation = 'Metadata only'
        }
    )
    Assert-Invalid (Save-And-Validate $metadataOnly) 'metadata-only evidence' 'must contain at least one resource behavior evidence item'

    $missingResourceEvidence = New-LocalFixture 'missing-resource-evidence'
    $missingResourceEvidence.Plan.localReference.evidence = @($missingResourceEvidence.Plan.localReference.evidence[0])
    Assert-Invalid (Save-And-Validate $missingResourceEvidence) 'missing resource behavior evidence' 'must contain at least one resource behavior evidence item'

    $missingLegacyEvidence = New-LocalFixture 'missing-legacy-evidence'
    $missingLegacyEvidence.Plan.localReference.evidence = @($missingLegacyEvidence.Plan.localReference.evidence[1])
    Assert-Invalid (Save-And-Validate $missingLegacyEvidence) 'missing legacy-script behavior evidence' 'must contain at least one legacy-script behavior evidence item'

    foreach ($readOnlyPath in @('doc/js_scripts/SourceController.js', 'doc/project_info.md', 'assets/scripts/bridge/LinkedController.ts')) {
        $readOnly = New-LocalFixture ('readonly-' + ($readOnlyPath -replace '[^A-Za-z0-9]', '-'))
        $readOnly.Plan.affectedFiles = @($readOnlyPath)
        $readOnly.Plan.steps[0].files = @($readOnlyPath)
        Assert-Invalid (Save-And-Validate $readOnly) "read-only affected file $readOnlyPath" 'affectedFiles cannot include an s-cli read-only path'
    }

    $junctionWrite = New-LocalFixture 'junction-write'
    $junctionTarget = Join-Path $testProject '__junction_target'
    $junctionPath = Join-Path $testProject 'assets\scripts\linked'
    New-Item -ItemType Directory -Path $junctionTarget -Force | Out-Null
    try {
        New-Item -ItemType Junction -Path $junctionPath -Target $junctionTarget -Force | Out-Null
        $junctionWrite.Plan.affectedFiles = @('assets/scripts/linked/NewController.ts')
        $junctionWrite.Plan.steps[0].files = @('assets/scripts/linked/NewController.ts')
        Assert-Invalid (Save-And-Validate $junctionWrite) 'new affected file below a junction' 'affectedFiles path traverses a reparse point'
    } finally {
        if (Test-Path -LiteralPath $junctionPath) {
            [IO.Directory]::Delete($junctionPath)
        }
        if (Test-Path -LiteralPath $junctionTarget) {
            Remove-Item -LiteralPath $junctionTarget -Recurse -Force
        }
    }

    $missingRoutingEvidence = New-LocalFixture 'missing-routing-evidence'
    $missingRoutingEvidence.Plan.analysisRouting.PSObject.Properties.Remove('evidence')
    Assert-Invalid (Save-And-Validate $missingRoutingEvidence) 'missing routing evidence' 'analysisRouting.evidence must contain at least one item'

    $nonTerraRouting = New-LocalFixture 'non-terra-routing'
    $nonTerraRouting.Plan.analysisRouting.model = 'sol'
    Assert-Invalid (Save-And-Validate $nonTerraRouting) 'non-terra routing' 'analysisRouting.model must be terra'

    $missingRootCauseEvidence = New-LocalFixture 'missing-root-cause-evidence'
    $missingRootCauseEvidence.Plan.rootCause.PSObject.Properties.Remove('evidence')
    Assert-Invalid (Save-And-Validate $missingRootCauseEvidence) 'missing root-cause evidence' 'rootCause.evidence must contain at least one item'

    $missingRawResponse = New-LocalFixture 'missing-raw-response'
    $missingRawResponse.Plan.analysisRouting.module = 'Reel / Spin Data Contract'
    $missingRawResponse.Plan.serverDataCheck.PSObject.Properties.Remove('rawResponse')
    Assert-Invalid (Save-And-Validate $missingRawResponse) 'reel plan without raw response' 'serverDataCheck.rawResponse must not be empty'

    $traditionalServerGate = New-LocalFixture 'traditional-server-gate'
    $traditionalServerGate.Plan.goal = -join ([char[]]@(0x4FEE, 0x6B63, 0x514D, 0x8CBB, 0x904A, 0x6232, 0x7684, 0x734E, 0x52F5, 0x986F, 0x793A))
    $traditionalServerGate.Plan.serverDataCheck.PSObject.Properties.Remove('rawResponse')
    Assert-Invalid (Save-And-Validate $traditionalServerGate) 'Traditional Chinese server-data gate' 'serverDataCheck.rawResponse must not be empty'

    $pureTraditionalAxleGate = New-LocalFixture 'pure-traditional-axle-gate'
    $pureTraditionalAxleGate.Plan.goal = -join ([char[]]@(0x4FEE, 0x6B63, 0x8F49, 0x8EF8, 0x8207, 0x8F2A, 0x8EF8))
    $pureTraditionalAxleGate.Plan.analysisRouting.module = 'Status Display'
    $pureTraditionalAxleGate.Plan.analysisRouting.evidence = @('Presentation state is local')
    $pureTraditionalAxleGate.Plan.steps[0].action = 'Update presentation state'
    $pureTraditionalAxleGate.Plan.PSObject.Properties.Remove('serverDataCheck')
    Assert-Invalid (Save-And-Validate $pureTraditionalAxleGate) 'pure Traditional Chinese axle server-data gate' 'serverDataCheck is required'

    $legacy = New-LocalFixture 'legacy-v1'
    $legacy.Plan.version = 1
    $legacy.Plan.PSObject.Properties.Remove('localReference')
    $legacy.Plan | Add-Member -MemberType NoteProperty -Name resourceBaseline -Value ([pscustomobject]@{
        status = 'VERIFIED'
        project = 'D:/historical/resource-project-no-longer-required'
        feature = 'Historical reference'
        evidence = @(
            [pscustomobject]@{
                source = 'assets/scripts/SourceController.js#method'
                target = 'assets/scripts/TargetController.ts#method'
                behavior = 'Historical behavior evidence'
                adaptation = 'Historical compatibility mapping'
            }
        )
        uncovered = @()
    })
    Assert-Invalid (Save-And-Validate $legacy) 'legacy v1 without opt-in' 'pass -AllowLegacyV1'
    Assert-Historical (Save-And-Validate $legacy -AllowLegacyV1) 'legacy v1 with explicit opt-in'
} finally {
    Assert-SafeTestProject
    if (Test-Path -LiteralPath $testProject) {
        Remove-Item -LiteralPath $testProject -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Output 'PASS: s_cli plan validator'
