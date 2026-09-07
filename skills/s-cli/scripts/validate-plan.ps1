param(
    [Parameter(Mandatory = $true)]
    [string]$PlanPath,
    [switch]$SkipPathChecks,
    [switch]$AllowLegacyV1
)

$ErrorActionPreference = 'Stop'
$errors = [System.Collections.Generic.List[string]]::new()
$skillRoot = Split-Path -Parent $PSScriptRoot
$skillsRoot = Split-Path -Parent $skillRoot
$codexRoot = Split-Path -Parent $skillsRoot
$repoRoot = Split-Path -Parent $codexRoot
$gamesRoot = Join-Path $repoRoot 'games'
$templatePath = Join-Path $skillRoot 'templates\plan.template.json'

function Add-PlanError([string]$Message) {
    $script:errors.Add($Message)
}

function Has-Text($Value) {
    return $null -ne $Value -and -not [string]::IsNullOrWhiteSpace([string]$Value)
}

function Has-Property($Object, [string]$Name) {
    return $null -ne $Object -and $null -ne $Object.PSObject.Properties[$Name]
}

function Get-NonNullCount($Value) {
    return @($Value | Where-Object { $null -ne $_ }).Count
}

function Normalize-RelativePath([string]$Value) {
    if (-not (Has-Text $Value)) { return '' }
    return (($Value -replace '\\', '/') -replace '^\./', '').TrimEnd('/')
}

function Is-SafeProjectRelativePath([string]$Value) {
    if (-not (Has-Text $Value) -or [IO.Path]::IsPathRooted($Value)) { return $false }
    if ($Value -match '[:*?"<>|]' -or $Value.StartsWith('\\') -or $Value.StartsWith('/')) { return $false }
    $segments = @($Value -split '[\\/]')
    return $segments.Count -gt 0 -and -not ($segments | Where-Object {
        $_ -eq '.' -or $_ -eq '..' -or $_ -eq '' -or $_.EndsWith('.') -or $_.EndsWith(' ')
    })
}

function Get-CanonicalPath([string]$Value) {
    if (-not (Has-Text $Value)) { return '' }
    try {
        $fullPath = [IO.Path]::GetFullPath($Value)
        return $fullPath.TrimEnd([char[]]@([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar))
    } catch {
        return ''
    }
}

function Test-CanonicalPathEqual([string]$Left, [string]$Right) {
    $leftPath = Get-CanonicalPath $Left
    $rightPath = Get-CanonicalPath $Right
    return (Has-Text $leftPath) -and $leftPath.Equals($rightPath, [StringComparison]::OrdinalIgnoreCase)
}

function Test-CanonicalPathWithin([string]$Candidate, [string]$Root) {
    $candidatePath = Get-CanonicalPath $Candidate
    $rootPath = Get-CanonicalPath $Root
    if (-not (Has-Text $candidatePath) -or -not (Has-Text $rootPath)) { return $false }
    $rootPrefix = "$rootPath$([IO.Path]::DirectorySeparatorChar)"
    return $candidatePath.Equals($rootPath, [StringComparison]::OrdinalIgnoreCase) -or
        $candidatePath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)
}

function Test-ReparsePoint([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    $item = Get-Item -LiteralPath $Path -Force
    return ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
}

function Get-ReparsePointOnPath([string]$Root, [string]$Candidate) {
    $rootPath = Get-CanonicalPath $Root
    $candidatePath = Get-CanonicalPath $Candidate
    if (-not (Test-CanonicalPathWithin $candidatePath $rootPath)) { return $null }

    $cursor = $rootPath
    if (Test-ReparsePoint $cursor) { return $cursor }
    if ($candidatePath.Equals($rootPath, [StringComparison]::OrdinalIgnoreCase)) { return $null }

    $relative = $candidatePath.Substring($rootPath.Length).TrimStart([char[]]@('\', '/'))
    foreach ($segment in ($relative -split '[\\/]')) {
        $cursor = Join-Path $cursor $segment
        if (-not (Test-Path -LiteralPath $cursor)) { break }
        if (Test-ReparsePoint $cursor) { return $cursor }
    }
    return $null
}

function Get-TargetWritePathViolation([string]$ProjectRoot, [string]$RelativePath) {
    $candidatePath = Get-CanonicalPath (Join-Path $ProjectRoot ((Normalize-RelativePath $RelativePath) -replace '/', [IO.Path]::DirectorySeparatorChar))
    if (-not (Test-CanonicalPathWithin $candidatePath $ProjectRoot)) {
        return "escapes the target project: $RelativePath"
    }
    $reparsePoint = Get-ReparsePointOnPath $ProjectRoot $candidatePath
    if (Has-Text $reparsePoint) {
        return "traverses a reparse point at $($reparsePoint): $RelativePath"
    }
    return $null
}

function Get-LocalTreeInventory([string]$Root, [string]$Extension = '') {
    $firstMatchingFile = $null
    $firstReparsePoint = $null
    if (-not (Test-Path -LiteralPath $Root -PathType Container)) {
        return [pscustomobject]@{
            firstMatchingFile = $null
            firstReparsePoint = $null
        }
    }
    if (Test-ReparsePoint $Root) {
        return [pscustomobject]@{
            firstMatchingFile = $null
            firstReparsePoint = $Root
        }
    }

    $pending = [System.Collections.Generic.Stack[string]]::new()
    $pending.Push($Root)
    while ($pending.Count -gt 0) {
        $directory = $pending.Pop()
        foreach ($child in (Get-ChildItem -LiteralPath $directory -Force)) {
            if (($child.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                if (-not (Has-Text $firstReparsePoint)) { $firstReparsePoint = $child.FullName }
                continue
            }
            if ($child.PSIsContainer) {
                $pending.Push($child.FullName)
            } elseif ((-not (Has-Text $Extension) -or
                $child.Extension.Equals($Extension, [StringComparison]::OrdinalIgnoreCase)) -and
                -not (Has-Text $firstMatchingFile)) {
                $firstMatchingFile = $child.FullName
            }
        }
    }

    return [pscustomobject]@{
        firstMatchingFile = $firstMatchingFile
        firstReparsePoint = $firstReparsePoint
    }
}

function Is-RelativePathWithin([string]$Candidate, [string]$Root) {
    $candidatePath = Normalize-RelativePath (($Candidate -split '#', 2)[0])
    $rootPath = Normalize-RelativePath $Root
    return $candidatePath.Equals($rootPath, [StringComparison]::OrdinalIgnoreCase) -or
        $candidatePath.StartsWith("$rootPath/", [StringComparison]::OrdinalIgnoreCase)
}

function Is-ProhibitedExternalBehaviorEvidence([string]$Value) {
    if (-not (Has-Text $Value)) { return $false }
    $text = $Value.Trim().Trim([char[]]@([char]0x60, [char]0x22, [char]0x27))
    if ([IO.Path]::IsPathRooted($text)) { return $true }
    return $text -match '(?i)[A-Z]:[\\/]' -or
        $text -match '(?i)(?:https?|file)://' -or
        $text -match '\\\\[A-Za-z0-9._-]' -or
        $text -match '(?:^|\s)/(?:[A-Za-z0-9._-]+/)' -or
        $text -match '(?:^|[\\/\s])\.\.[\\/]' -or
        $text -match '(?i)(?:^|[\\/\s])CC3Proj(?:[\\/#]|$)' -or
        $text -match '(?i)(?:^|[\\/\s])UIProj(?:[\\/#]|$)' -or
        $text -match '(?i)(?:^|[\\/\s])[^\\/\s]+_UI(?:[\\/#]|$)' -or
        $text -match '(?i)(?:^|[\\/\s])resource[-_]project(?:[\\/#]|$)' -or
        $text -match '(?i)(?:^|[\\/\s])games[\\/]slot-fe-[^\\/\s]+(?:[\\/#]|$)' -or
        $text -match '(?i)(?:^|[\\/\s])slot-fe-[^\\/\s]+[\\/](?:assets|doc|settings)(?:[\\/#]|$)'
}

function Get-PathLikeBehaviorEvidence([string]$Value) {
    if (-not (Has-Text $Value)) { return $null }
    $trimmed = $Value.Trim().Trim([char[]]@([char]0x60, [char]0x22, [char]0x27))
    $locator = (($trimmed -split '#', 2)[0]).Trim()
    if (-not (Has-Text $locator)) { return $null }
    $normalized = Normalize-RelativePath $locator
    if ($normalized -match '(?i)^(?:assets|doc|settings|extensions|profiles|build-templates)/') {
        return $locator
    }
    if ($locator -notmatch '\s' -and
        ($normalized -match '/' -or $normalized -match '^[^/]+\.[A-Za-z0-9][A-Za-z0-9._-]*$') -and
        $normalized -match '[^/]+\.[A-Za-z0-9][A-Za-z0-9._-]*$') {
        return $locator
    }
    return $null
}

function Add-TargetRelativeEvidenceErrors(
    [string]$Value,
    [string]$FieldName,
    [int]$PlanVersion,
    [bool]$ShouldSkipPathChecks,
    [bool]$CanInspectProject,
    [string]$ProjectPath
) {
    if ($PlanVersion -ne 2 -or -not (Has-Text $Value)) { return }
    if (Is-ProhibitedExternalBehaviorEvidence $Value) {
        Add-PlanError "$FieldName cannot cite an external resource-project locator: $Value"
        return
    }

    $pathLikeSource = Get-PathLikeBehaviorEvidence $Value
    if (-not (Has-Text $pathLikeSource)) { return }
    if (-not (Is-SafeProjectRelativePath $pathLikeSource)) {
        Add-PlanError "Path-like $FieldName must be target-project-relative: $Value"
        return
    }
    if ($ShouldSkipPathChecks -or -not $CanInspectProject) { return }

    $sourcePath = Get-CanonicalPath (Join-Path $ProjectPath ((Normalize-RelativePath $pathLikeSource) -replace '/', [IO.Path]::DirectorySeparatorChar))
    if (-not (Test-CanonicalPathWithin $sourcePath $ProjectPath)) {
        Add-PlanError "Path-like $FieldName escaped the target project: $Value"
    } elseif (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        Add-PlanError "Path-like $FieldName must reference an existing regular file: $Value"
    } else {
        $reparsePoint = Get-ReparsePointOnPath $ProjectPath $sourcePath
        if (Has-Text $reparsePoint) {
            Add-PlanError "Path-like $FieldName cannot traverse a reparse point: $reparsePoint"
        }
    }
}

function Get-ProjectInfoValues([string]$Text, [string]$Name) {
    $values = [System.Collections.Generic.List[string]]::new()
    foreach ($line in ($Text -split '\r?\n')) {
        $normalized = ($line.Trim() -replace '^[-*]\s*', '').Replace([char]0xFF1A, [char]0x003A)
        $normalized = $normalized.Replace([string][char]96, '')
        $separator = $normalized.IndexOf(':')
        if ($separator -lt 0) { continue }
        $key = $normalized.Substring(0, $separator).Trim()
        if ($key.Equals($Name, [StringComparison]::OrdinalIgnoreCase)) {
            $values.Add($normalized.Substring($separator + 1).Trim())
        }
    }
    return @($values)
}

function Is-ServerDataTask($Plan) {
    $text = @($Plan.goal, $Plan.analysisRouting.module, $Plan.analysisRouting.evidence, $Plan.steps.action) -join ' '
    if ($text -match '(?i)spin|reel|slotreel|drop|cascade|peeking|layout|mask|multiplier|free.?game|bonus|respin|turntable') {
        return $true
    }
    $localizedKeywords = @(
        (-join ([char[]]@(0x8F6C, 0x76D8))),
        (-join ([char[]]@(0x505C, 0x8F6E))),
        (-join ([char[]]@(0x514D, 0x8D39))),
        (-join ([char[]]@(0x5956, 0x52B1))),
        (-join ([char[]]@(0x8F49, 0x76E4))),
        (-join ([char[]]@(0x505C, 0x8F2A))),
        (-join ([char[]]@(0x8F49, 0x8F2A))),
        (-join ([char[]]@(0x8F49, 0x8EF8))),
        (-join ([char[]]@(0x8F2A, 0x8EF8))),
        (-join ([char[]]@(0x7787, 0x724C))),
        (-join ([char[]]@(0x7248, 0x9762))),
        (-join ([char[]]@(0x906E, 0x7F69))),
        (-join ([char[]]@(0x91CD, 0x8F49))),
        (-join ([char[]]@(0x514D, 0x8CBB))),
        (-join ([char[]]@(0x734E, 0x52F5))),
        (-join ([char[]]@(0x6389, 0x843D))),
        (-join ([char[]]@(0x6D88, 0x9664))),
        (-join ([char[]]@(0x500D, 0x7387)))
    )
    return @($localizedKeywords | Where-Object { $text.Contains($_) }).Count -gt 0
}

try {
    $resolvedPlan = (Resolve-Path -LiteralPath $PlanPath).Path
    $plan = Get-Content -LiteralPath $resolvedPlan -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-Error "Cannot read plan JSON: $($_.Exception.Message)"
    exit 1
}

$requiredFields = @('version', 'taskId', 'project', 'goal', 'rootCause', 'analysisRouting', 'baseline', 'affectedFiles', 'steps', 'acceptance', 'stopConditions')
if ($plan.version -eq 2) {
    $requiredFields += 'localReference'
} elseif ($plan.version -eq 1) {
    $requiredFields += 'resourceBaseline'
} else {
    Add-PlanError 'version must be 2; version 1 is available only for explicit historical validation'
}

foreach ($field in $requiredFields) {
    if (-not (Has-Property $plan $field)) {
        Add-PlanError "Missing field: $field"
    }
}

if ($plan.version -eq 1 -and -not $AllowLegacyV1) {
    Add-PlanError 'version 1 is legacy; pass -AllowLegacyV1 only when revalidating a historical plan'
}
foreach ($field in @('taskId', 'project', 'goal')) {
    if (-not (Has-Text $plan.$field)) { Add-PlanError "$field must not be empty" }
}

$derivedProjectPath = $null
$derivedReplicationId = ''
$canInspectDerivedProject = $false
if ($SkipPathChecks) {
    if (-not (Test-CanonicalPathEqual $resolvedPlan $templatePath)) {
        Add-PlanError '-SkipPathChecks is reserved for the canonical s-cli plan template'
    }
} elseif ($plan.version -eq 2) {
    $resolvedPlanPath = Get-CanonicalPath $resolvedPlan
    $canonicalGamesRoot = Get-CanonicalPath $gamesRoot
    if (-not (Test-CanonicalPathWithin $resolvedPlanPath $canonicalGamesRoot)) {
        Add-PlanError 'Version 2 plan must be under <repo>/games/<target>/doc/s_cli/<task-id>/plan.json'
    } else {
        $relativePlanPath = $resolvedPlanPath.Substring($canonicalGamesRoot.Length).TrimStart([char[]]@('\', '/'))
        $planSegments = @($relativePlanPath -split '[\\/]')
        if ($planSegments.Count -ne 5 -or
            -not $planSegments[1].Equals('doc', [StringComparison]::OrdinalIgnoreCase) -or
            -not $planSegments[2].Equals('s_cli', [StringComparison]::OrdinalIgnoreCase) -or
            -not $planSegments[4].Equals('plan.json', [StringComparison]::OrdinalIgnoreCase)) {
            Add-PlanError 'Version 2 plan must be under <repo>/games/<target>/doc/s_cli/<task-id>/plan.json'
        } else {
            $derivedProjectPath = Get-CanonicalPath (Join-Path $canonicalGamesRoot $planSegments[0])
            if ($planSegments[0] -match '^slot-fe-(?<replicationId>[A-Za-z0-9][A-Za-z0-9_-]*)$') {
                $derivedReplicationId = [string]$Matches.replicationId
            } else {
                Add-PlanError "Target project directory must match slot-fe-{replicationId}: $($planSegments[0])"
            }
            if (-not (Has-Text $plan.taskId) -or
                -not ([string]$plan.taskId).Equals($planSegments[3], [StringComparison]::OrdinalIgnoreCase)) {
                Add-PlanError "taskId must match the plan directory name '$($planSegments[3])'"
            }
            if (-not [IO.Path]::IsPathRooted([string]$plan.project) -or
                -not (Test-CanonicalPathEqual ([string]$plan.project) $derivedProjectPath)) {
                Add-PlanError "plan.project must canonically equal the target derived from PlanPath: $derivedProjectPath"
            }

            if (-not (Test-Path -LiteralPath $derivedProjectPath -PathType Container)) {
                Add-PlanError "Derived target project directory does not exist: $derivedProjectPath"
            } else {
                if (Test-ReparsePoint $derivedProjectPath) {
                    Add-PlanError "Target project cannot be a reparse point: $derivedProjectPath"
                } else {
                    $planReparsePoint = Get-ReparsePointOnPath $derivedProjectPath $resolvedPlanPath
                    if (Has-Text $planReparsePoint) {
                        Add-PlanError "Plan path cannot traverse a reparse point: $planReparsePoint"
                    } else {
                        $canInspectDerivedProject = $true
                    }
                }
            }
        }
    }
} elseif ($plan.version -eq 1 -and (Has-Text $plan.project) -and
    -not (Test-Path -LiteralPath $plan.project -PathType Container)) {
    Add-PlanError "Project directory does not exist: $($plan.project)"
}

$rootCause = $plan.rootCause
if ($rootCause.status -ne 'VERIFIED') { Add-PlanError 'rootCause.status must be VERIFIED before planning' }
foreach ($field in @('statement', 'boundary')) {
    if (-not (Has-Text $rootCause.$field)) { Add-PlanError "rootCause.$field must not be empty" }
}
$rootCauseEvidence = @($rootCause.evidence | Where-Object { $null -ne $_ })
if ($rootCauseEvidence.Count -eq 0) { Add-PlanError 'rootCause.evidence must contain at least one item' }
foreach ($item in $rootCauseEvidence) {
    foreach ($field in @('source', 'observation')) {
        if (-not (Has-Text $item.$field)) { Add-PlanError "Each rootCause.evidence item requires $field" }
    }
    Add-TargetRelativeEvidenceErrors `
        -Value ([string]$item.source) `
        -FieldName 'rootCause.evidence.source' `
        -PlanVersion ([int]$plan.version) `
        -ShouldSkipPathChecks ([bool]$SkipPathChecks) `
        -CanInspectProject $canInspectDerivedProject `
        -ProjectPath $derivedProjectPath
}

if ($plan.version -eq 2) {
    $reference = $plan.localReference
    if ($reference.status -ne 'VERIFIED') { Add-PlanError 'localReference.status must be VERIFIED' }
    foreach ($field in @('resourceRoot', 'scriptsRoot', 'projectInfo', 'feature')) {
        if (-not (Has-Text $reference.$field)) { Add-PlanError "localReference.$field must not be empty" }
    }

    $hasReplicationIdField = Has-Property $reference 'replicationId'
    $hasMetadataGameIdField = Has-Property $reference 'metadataGameId'
    $hasLegacyGameIdField = Has-Property $reference 'gameId'
    $usesCurrentIdentityShape = $hasReplicationIdField -and $hasMetadataGameIdField -and -not $hasLegacyGameIdField
    $usesLegacyIdentityShape = $hasLegacyGameIdField -and -not $hasReplicationIdField -and -not $hasMetadataGameIdField

    if (-not $usesCurrentIdentityShape -and -not $usesLegacyIdentityShape) {
        Add-PlanError 'localReference identity must use either replicationId + metadataGameId without gameId, or legacy gameId only'
    }

    $declaredReplicationId = if ($hasReplicationIdField) { [string]$reference.replicationId } else { '' }
    $declaredMetadataGameId = if ($hasMetadataGameIdField) { [string]$reference.metadataGameId } else { '' }
    $legacyGameId = if ($hasLegacyGameIdField) { [string]$reference.gameId } else { '' }

    if ($usesCurrentIdentityShape -and -not (Has-Text $declaredReplicationId)) {
        Add-PlanError 'localReference.replicationId must not be empty'
    }
    if ($usesCurrentIdentityShape -and -not (Has-Text $declaredMetadataGameId)) {
        Add-PlanError 'localReference.metadataGameId must not be empty'
    }
    if ($usesLegacyIdentityShape -and -not (Has-Text $legacyGameId)) {
        Add-PlanError 'legacy localReference.gameId must not be empty'
    }

    $replicationId = if (Has-Text $derivedReplicationId) {
        $derivedReplicationId
    } elseif (Has-Text $declaredReplicationId) {
        $declaredReplicationId
    } else {
        $legacyGameId
    }
    $metadataGameId = if (Has-Text $declaredMetadataGameId) { $declaredMetadataGameId } else { $legacyGameId }

    $hasSafeReplicationId = (Has-Text $replicationId) -and $replicationId -match '^[A-Za-z0-9][A-Za-z0-9_-]*$'
    $hasSafeMetadataGameId = (Has-Text $metadataGameId) -and $metadataGameId -match '^[A-Za-z0-9][A-Za-z0-9_-]*$'
    if ((Has-Text $replicationId) -and -not $hasSafeReplicationId) {
        Add-PlanError 'localReference.replicationId may contain only letters, digits, underscores, and hyphens'
    }
    if ((Has-Text $metadataGameId) -and -not $hasSafeMetadataGameId) {
        Add-PlanError 'localReference.metadataGameId may contain only letters, digits, underscores, and hyphens'
    }
    if ((Has-Text $declaredReplicationId) -and (Has-Text $derivedReplicationId) -and
        -not $declaredReplicationId.Equals($derivedReplicationId, [StringComparison]::Ordinal)) {
        Add-PlanError "localReference.replicationId '$declaredReplicationId' must match the target project slug '$derivedReplicationId' with ordinal-exact casing"
    }
    if ($usesLegacyIdentityShape -and (Has-Text $legacyGameId) -and (Has-Text $derivedReplicationId) -and
        -not $legacyGameId.Equals($derivedReplicationId, [StringComparison]::Ordinal)) {
        Add-PlanError "legacy localReference.gameId '$legacyGameId' must exactly match the target project slug '$derivedReplicationId'; migrate the plan to replicationId + metadataGameId"
    }

    $resourceRoot = Normalize-RelativePath ([string]$reference.resourceRoot)
    $scriptsRoot = Normalize-RelativePath ([string]$reference.scriptsRoot)
    $projectInfo = Normalize-RelativePath ([string]$reference.projectInfo)
    $expectedResourceRoot = "assets/resources/$($replicationId)_res"
    if (-not (Is-SafeProjectRelativePath $reference.resourceRoot) -or
        -not $resourceRoot.Equals($expectedResourceRoot, [StringComparison]::OrdinalIgnoreCase)) {
        Add-PlanError "localReference.resourceRoot must be the project-relative path: $expectedResourceRoot"
    }
    if (-not (Is-SafeProjectRelativePath $reference.scriptsRoot) -or
        -not $scriptsRoot.Equals('doc/js_scripts', [StringComparison]::OrdinalIgnoreCase)) {
        Add-PlanError 'localReference.scriptsRoot must be the project-relative path: doc/js_scripts'
    }
    if (-not (Is-SafeProjectRelativePath $reference.projectInfo) -or
        -not $projectInfo.Equals('doc/project_info.md', [StringComparison]::OrdinalIgnoreCase)) {
        Add-PlanError 'localReference.projectInfo must be the project-relative path: doc/project_info.md'
    }

    $hasValidReferenceRoots = $hasSafeReplicationId -and $hasSafeMetadataGameId -and
        (Is-SafeProjectRelativePath $reference.resourceRoot) -and
        $resourceRoot.Equals($expectedResourceRoot, [StringComparison]::OrdinalIgnoreCase) -and
        (Is-SafeProjectRelativePath $reference.scriptsRoot) -and
        $scriptsRoot.Equals('doc/js_scripts', [StringComparison]::OrdinalIgnoreCase) -and
        (Is-SafeProjectRelativePath $reference.projectInfo) -and
        $projectInfo.Equals('doc/project_info.md', [StringComparison]::OrdinalIgnoreCase)

    $resourcePath = $null
    $scriptsPath = $null
    $projectInfoPath = $null
    if (-not $SkipPathChecks -and $canInspectDerivedProject -and $hasValidReferenceRoots) {
        $resourcePath = Join-Path $derivedProjectPath ($expectedResourceRoot -replace '/', [IO.Path]::DirectorySeparatorChar)
        $scriptsPath = Join-Path $derivedProjectPath 'doc\js_scripts'
        $projectInfoPath = Join-Path $derivedProjectPath 'doc\project_info.md'

        $resourceInventory = Get-LocalTreeInventory $resourcePath
        if (-not (Test-Path -LiteralPath $resourcePath -PathType Container)) {
            Add-PlanError "Local competitor resource directory does not exist: $resourcePath"
        } elseif (Has-Text $resourceInventory.firstReparsePoint) {
            Add-PlanError "Local competitor resource directory cannot contain a reparse point: $($resourceInventory.firstReparsePoint)"
        } elseif (-not (Has-Text $resourceInventory.firstMatchingFile)) {
            Add-PlanError "Local competitor resource directory is empty: $resourcePath"
        }

        $scriptsInventory = Get-LocalTreeInventory $scriptsPath '.js'
        if (-not (Test-Path -LiteralPath $scriptsPath -PathType Container)) {
            Add-PlanError "Local competitor script directory does not exist: $scriptsPath"
        } elseif (Has-Text $scriptsInventory.firstReparsePoint) {
            Add-PlanError "Local competitor script directory cannot contain a reparse point: $($scriptsInventory.firstReparsePoint)"
        } elseif (-not (Has-Text $scriptsInventory.firstMatchingFile)) {
            Add-PlanError "Local competitor script directory contains no JavaScript: $scriptsPath"
        }

        if (-not (Test-Path -LiteralPath $projectInfoPath -PathType Leaf)) {
            Add-PlanError "Local project info file does not exist: $projectInfoPath"
        } elseif (Test-ReparsePoint $projectInfoPath) {
            Add-PlanError "Local project info file cannot be a reparse point: $projectInfoPath"
        } else {
            $projectInfoText = Get-Content -LiteralPath $projectInfoPath -Raw -Encoding UTF8
            $projectInfoGameIds = @(Get-ProjectInfoValues $projectInfoText 'gameId')
            $competitorUrls = @(Get-ProjectInfoValues $projectInfoText 'competitorUrl')
            $projectInfoGameId = if ($projectInfoGameIds.Count -eq 1) { [string]$projectInfoGameIds[0] } else { '' }
            $competitorUrl = if ($competitorUrls.Count -eq 1) { [string]$competitorUrls[0] } else { '' }
            if ($projectInfoGameIds.Count -ne 1 -or -not (Has-Text $projectInfoGameId)) {
                Add-PlanError 'doc/project_info.md must define gameId exactly once with a non-empty value'
            } elseif ($usesLegacyIdentityShape -and
                -not $projectInfoGameId.Equals($legacyGameId, [StringComparison]::Ordinal)) {
                Add-PlanError "legacy localReference.gameId '$legacyGameId' must exactly match doc/project_info.md gameId '$projectInfoGameId'; migrate the plan to replicationId + metadataGameId"
            } elseif (-not $usesLegacyIdentityShape -and
                -not $projectInfoGameId.Equals($metadataGameId, [StringComparison]::OrdinalIgnoreCase)) {
                Add-PlanError "doc/project_info.md gameId '$projectInfoGameId' does not match localReference.metadataGameId '$metadataGameId'"
            }

            $parsedUrl = $null
            if ($competitorUrls.Count -ne 1 -or -not (Has-Text $competitorUrl)) {
                Add-PlanError 'doc/project_info.md must define competitorUrl exactly once with a non-empty value'
            } elseif (
                -not [Uri]::TryCreate($competitorUrl, [UriKind]::Absolute, [ref]$parsedUrl) -or
                @('http', 'https') -notcontains $parsedUrl.Scheme -or
                -not (Has-Text $parsedUrl.Host)) {
                Add-PlanError 'doc/project_info.md competitorUrl must be an absolute HTTP(S) URL'
            }
        }
    }

    $evidence = @($reference.evidence | Where-Object { $null -ne $_ })
    if ($evidence.Count -eq 0) { Add-PlanError 'localReference.evidence must contain at least one item' }
    $resourceEvidenceCount = 0
    $legacyScriptEvidenceCount = 0
    foreach ($item in $evidence) {
        foreach ($field in @('kind', 'source', 'target', 'behavior', 'adaptation')) {
            if (-not (Has-Text $item.$field)) { Add-PlanError "Each localReference.evidence item requires $field" }
        }

        $source = [string]$item.source
        $sourcePath = ($source -split '#', 2)[0]
        if (-not (Is-SafeProjectRelativePath $sourcePath)) {
            Add-PlanError "localReference evidence source must be project-relative: $source"
            continue
        }
        if (-not (Is-SafeProjectRelativePath ([string]$item.target))) {
            Add-PlanError "localReference evidence target must be project-relative: $($item.target)"
        }

        $allowedSourceRoot = $null
        switch ([string]$item.kind) {
            'resource' {
                if (-not (Is-RelativePathWithin $source $resourceRoot)) {
                    Add-PlanError "Resource evidence must be under $($resourceRoot): $source"
                } else {
                    $resourceEvidenceCount++
                    $allowedSourceRoot = $resourcePath
                }
            }
            'legacy-script' {
                if (-not (Is-RelativePathWithin $source $scriptsRoot)) {
                    Add-PlanError "Legacy-script evidence must be under $($scriptsRoot): $source"
                } elseif (-not ([IO.Path]::GetExtension($sourcePath)).Equals('.js', [StringComparison]::OrdinalIgnoreCase)) {
                    Add-PlanError "Legacy-script evidence source must be a JavaScript file ending in .js: $source"
                } else {
                    $legacyScriptEvidenceCount++
                    $allowedSourceRoot = $scriptsPath
                }
            }
            'project-info' {
                if (-not (Normalize-RelativePath $sourcePath).Equals($projectInfo, [StringComparison]::OrdinalIgnoreCase)) {
                    Add-PlanError "Project-info evidence must reference $($projectInfo): $source"
                } else {
                    $allowedSourceRoot = $projectInfoPath
                }
            }
            default {
                Add-PlanError "localReference evidence kind must be resource, legacy-script, or project-info: $($item.kind)"
            }
        }

        if (-not $SkipPathChecks -and $canInspectDerivedProject -and (Has-Text $allowedSourceRoot)) {
            $localSourcePath = Get-CanonicalPath (Join-Path $derivedProjectPath ((Normalize-RelativePath $sourcePath) -replace '/', [IO.Path]::DirectorySeparatorChar))
            if (-not (Test-CanonicalPathWithin $localSourcePath $allowedSourceRoot)) {
                Add-PlanError "Local competitor evidence source escaped its fixed root: $source"
            } elseif (-not (Test-Path -LiteralPath $localSourcePath -PathType Leaf)) {
                Add-PlanError "Local competitor evidence source must be an existing regular file: $source"
            } else {
                $sourceReparsePoint = Get-ReparsePointOnPath $allowedSourceRoot $localSourcePath
                if (Has-Text $sourceReparsePoint) {
                    Add-PlanError "Local competitor evidence source cannot traverse a reparse point: $sourceReparsePoint"
                }
            }
        }
    }
    if ($resourceEvidenceCount -eq 0) {
        Add-PlanError 'localReference.evidence must contain at least one resource behavior evidence item under resourceRoot'
    }
    if ($legacyScriptEvidenceCount -eq 0) {
        Add-PlanError 'localReference.evidence must contain at least one legacy-script behavior evidence item under scriptsRoot'
    }
    if ((Get-NonNullCount $reference.uncovered) -gt 0) { Add-PlanError 'localReference.uncovered must be empty' }
} elseif ($plan.version -eq 1) {
    $resource = $plan.resourceBaseline
    if ($resource.status -ne 'VERIFIED') { Add-PlanError 'resourceBaseline.status must be VERIFIED' }
    foreach ($field in @('project', 'feature')) {
        if (-not (Has-Text $resource.$field)) { Add-PlanError "resourceBaseline.$field must not be empty" }
    }

    $evidence = @($resource.evidence | Where-Object { $null -ne $_ })
    if ($evidence.Count -eq 0) { Add-PlanError 'resourceBaseline.evidence must contain at least one item' }
    foreach ($item in $evidence) {
        foreach ($field in @('source', 'target', 'behavior', 'adaptation')) {
            if (-not (Has-Text $item.$field)) { Add-PlanError "Each resourceBaseline.evidence item requires $field" }
        }
    }
    if ((Get-NonNullCount $resource.uncovered) -gt 0) { Add-PlanError 'resourceBaseline.uncovered must be empty' }
}

$serverCheck = $plan.serverDataCheck
if (Is-ServerDataTask $plan) {
    if (-not (Has-Property $plan 'serverDataCheck')) {
        Add-PlanError 'serverDataCheck is required for Spin/Reel/Drop/Cascade/Multiplier/Free Game/Bonus tasks'
    } else {
        if ($serverCheck.status -ne 'VERIFIED') { Add-PlanError 'serverDataCheck.status must be VERIFIED before planning' }
        foreach ($field in @('scope', 'rawResponse', 'contract', 'responsibility')) {
            if (-not (Has-Text $serverCheck.$field)) { Add-PlanError "serverDataCheck.$field must not be empty" }
        }
        if (@('server', 'api', 'mapper', 'client') -notcontains ([string]$serverCheck.responsibility).ToLowerInvariant()) {
            Add-PlanError 'serverDataCheck.responsibility must be server, api, mapper, or client'
        }
        $serverEvidence = @($serverCheck.evidence | Where-Object { $null -ne $_ })
        if ($serverEvidence.Count -eq 0) { Add-PlanError 'serverDataCheck.evidence must contain at least one item' }
        foreach ($item in $serverEvidence) {
            foreach ($field in @('source', 'observation')) {
                if (-not (Has-Text $item.$field)) { Add-PlanError "Each serverDataCheck.evidence item requires $field" }
            }
        }
    }
}

if ($plan.version -eq 2 -and (Has-Property $plan 'serverDataCheck')) {
    Add-TargetRelativeEvidenceErrors `
        -Value ([string]$serverCheck.rawResponse) `
        -FieldName 'serverDataCheck.rawResponse' `
        -PlanVersion ([int]$plan.version) `
        -ShouldSkipPathChecks ([bool]$SkipPathChecks) `
        -CanInspectProject $canInspectDerivedProject `
        -ProjectPath $derivedProjectPath

    foreach ($item in @($serverCheck.evidence | Where-Object { $null -ne $_ })) {
        Add-TargetRelativeEvidenceErrors `
            -Value ([string]$item.source) `
            -FieldName 'serverDataCheck.evidence.source' `
            -PlanVersion ([int]$plan.version) `
            -ShouldSkipPathChecks ([bool]$SkipPathChecks) `
            -CanInspectProject $canInspectDerivedProject `
            -ProjectPath $derivedProjectPath
    }
}

$allowedModels = @('terra', 'gpt-5.6-terra')
if ($allowedModels -notcontains $plan.analysisRouting.model) {
    Add-PlanError 'analysisRouting.model must be terra'
}
if (-not (Has-Text $plan.analysisRouting.module)) {
    Add-PlanError 'analysisRouting.module must not be empty'
}
$analysisRoutingEvidence = @($plan.analysisRouting.evidence | Where-Object { $null -ne $_ })
if ($analysisRoutingEvidence.Count -eq 0) {
    Add-PlanError 'analysisRouting.evidence must contain at least one item'
}
foreach ($item in $analysisRoutingEvidence) {
    if ($plan.version -eq 2 -and (Is-ProhibitedExternalBehaviorEvidence ([string]$item))) {
        Add-PlanError "analysisRouting.evidence cannot cite an external resource-project locator: $item"
    }
}

if (-not (Has-Text $plan.baseline.branch)) { Add-PlanError 'baseline.branch must not be empty' }
if (-not (Has-Property $plan.baseline 'dirtyFiles')) { Add-PlanError 'baseline.dirtyFiles is required' }

$affectedFiles = @($plan.affectedFiles | Where-Object { $null -ne $_ })
if ($affectedFiles.Count -eq 0) { Add-PlanError 'affectedFiles must contain at least one file' }
$affectedSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$normalizedAffectedFiles = [System.Collections.Generic.List[string]]::new()
foreach ($file in $affectedFiles) {
    if (-not (Has-Text $file)) {
        Add-PlanError 'affectedFiles cannot contain empty paths'
        continue
    }
    if (-not (Is-SafeProjectRelativePath ([string]$file)) -or ([string]$file).Contains('#')) {
        Add-PlanError "affectedFiles path must be a safe project-relative file path: $file"
        continue
    }
    $normalizedFile = Normalize-RelativePath ([string]$file)
    if ((Is-RelativePathWithin $normalizedFile 'doc/js_scripts') -or
        $normalizedFile.Equals('doc/project_info.md', [StringComparison]::OrdinalIgnoreCase) -or
        (Is-RelativePathWithin $normalizedFile 'assets/scripts/bridge')) {
        Add-PlanError "affectedFiles cannot include an s-cli read-only path: $file"
    }
    if ($plan.version -eq 2 -and -not $SkipPathChecks -and $canInspectDerivedProject) {
        $writePathViolation = Get-TargetWritePathViolation $derivedProjectPath $normalizedFile
        if (Has-Text $writePathViolation) {
            Add-PlanError "affectedFiles path $($writePathViolation)"
        }
    }
    [void]$affectedSet.Add($normalizedFile)
    $normalizedAffectedFiles.Add($normalizedFile)
}

$steps = @($plan.steps | Where-Object { $null -ne $_ })
if ($steps.Count -eq 0) { Add-PlanError 'steps must contain at least one item' }
$coveredFiles = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($step in $steps) {
    foreach ($field in @('id', 'action')) {
        if (-not (Has-Text $step.$field)) { Add-PlanError "Each step requires $field" }
    }
    if ((Get-NonNullCount $step.files) -eq 0) { Add-PlanError "Step '$($step.id)' requires files" }
    if ((Get-NonNullCount $step.verify) -eq 0) { Add-PlanError "Step '$($step.id)' requires verify commands" }
    foreach ($file in @($step.files | Where-Object { $null -ne $_ })) {
        if (-not (Is-SafeProjectRelativePath ([string]$file)) -or ([string]$file).Contains('#')) {
            Add-PlanError "Step '$($step.id)' uses an unsafe project-relative file path: $file"
            continue
        }
        $normalizedFile = Normalize-RelativePath ([string]$file)
        if ($plan.version -eq 2 -and -not $SkipPathChecks -and $canInspectDerivedProject) {
            $writePathViolation = Get-TargetWritePathViolation $derivedProjectPath $normalizedFile
            if (Has-Text $writePathViolation) {
                Add-PlanError "Step '$($step.id)' file $($writePathViolation)"
            }
        }
        if (-not $affectedSet.Contains($normalizedFile)) {
            Add-PlanError "Step '$($step.id)' uses a file outside affectedFiles: $file"
        } else {
            [void]$coveredFiles.Add($normalizedFile)
        }
    }
}
foreach ($file in $normalizedAffectedFiles) {
    if (-not $coveredFiles.Contains([string]$file)) { Add-PlanError "affectedFiles entry is not covered by a step: $file" }
}

if ((Get-NonNullCount $plan.constraints) -eq 0) { Add-PlanError 'constraints must contain at least one item' }
if ((Get-NonNullCount $plan.acceptance) -eq 0) { Add-PlanError 'acceptance must contain at least one item' }
if ((Get-NonNullCount $plan.stopConditions) -eq 0) { Add-PlanError 'stopConditions must contain at least one item' }

if ($errors.Count -gt 0) {
    foreach ($message in $errors) { [Console]::Error.WriteLine("ERROR: $message") }
    exit 1
}

if ($plan.version -eq 1) {
    Write-Output "HISTORICAL_VALID_ONLY: $resolvedPlan"
} else {
    Write-Output "VALID: $resolvedPlan"
}
exit 0
