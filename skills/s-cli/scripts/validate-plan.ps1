param(
    [Parameter(Mandatory = $true)]
    [string]$PlanPath,
    [switch]$SkipPathChecks
)

$ErrorActionPreference = 'Stop'
$errors = [System.Collections.Generic.List[string]]::new()

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

try {
    $resolvedPlan = (Resolve-Path -LiteralPath $PlanPath).Path
    $plan = Get-Content -LiteralPath $resolvedPlan -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-Error "Cannot read plan JSON: $($_.Exception.Message)"
    exit 1
}

foreach ($field in @('version', 'taskId', 'project', 'goal', 'rootCause', 'resourceBaseline', 'analysisRouting', 'baseline', 'affectedFiles', 'steps', 'acceptance', 'stopConditions')) {
    if (-not (Has-Property $plan $field)) {
        Add-PlanError "Missing field: $field"
    }
}

if ($plan.version -ne 1) { Add-PlanError 'version must be 1' }
foreach ($field in @('taskId', 'project', 'goal')) {
    if (-not (Has-Text $plan.$field)) { Add-PlanError "$field must not be empty" }
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
}

if (-not $SkipPathChecks -and (Has-Text $plan.project) -and -not (Test-Path -LiteralPath $plan.project -PathType Container)) {
    Add-PlanError "Project directory does not exist: $($plan.project)"
}

$resource = $plan.resourceBaseline
if ($resource.status -ne 'VERIFIED') { Add-PlanError 'resourceBaseline.status must be VERIFIED' }
foreach ($field in @('project', 'feature')) {
    if (-not (Has-Text $resource.$field)) { Add-PlanError "resourceBaseline.$field must not be empty" }
}
if (-not $SkipPathChecks -and (Has-Text $resource.project) -and -not (Test-Path -LiteralPath $resource.project -PathType Container)) {
    Add-PlanError "Resource project directory does not exist: $($resource.project)"
}

$evidence = @($resource.evidence | Where-Object { $null -ne $_ })
if ($evidence.Count -eq 0) { Add-PlanError 'resourceBaseline.evidence must contain at least one item' }
foreach ($item in $evidence) {
    foreach ($field in @('source', 'target', 'behavior', 'adaptation')) {
        if (-not (Has-Text $item.$field)) { Add-PlanError "Each resourceBaseline.evidence item requires $field" }
    }
}
if ((Get-NonNullCount $resource.uncovered) -gt 0) { Add-PlanError 'resourceBaseline.uncovered must be empty' }

$allowedModels = @('terra', 'sol', 'gpt-5.6-terra', 'gpt-5.6-sol')
if ($allowedModels -notcontains $plan.analysisRouting.model) {
    Add-PlanError 'analysisRouting.model must be terra or sol'
}
if (-not (Has-Text $plan.analysisRouting.module)) {
    Add-PlanError 'analysisRouting.module must not be empty'
}
if ((Get-NonNullCount $plan.analysisRouting.evidence) -eq 0) {
    Add-PlanError 'analysisRouting.evidence must contain at least one item'
}

if (-not (Has-Text $plan.baseline.branch)) { Add-PlanError 'baseline.branch must not be empty' }
if (-not (Has-Property $plan.baseline 'dirtyFiles')) { Add-PlanError 'baseline.dirtyFiles is required' }

$affectedFiles = @($plan.affectedFiles | Where-Object { $null -ne $_ })
if ($affectedFiles.Count -eq 0) { Add-PlanError 'affectedFiles must contain at least one file' }
$affectedSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($file in $affectedFiles) {
    if (-not (Has-Text $file)) {
        Add-PlanError 'affectedFiles cannot contain empty paths'
        continue
    }
    if ([IO.Path]::IsPathRooted($file) -or (($file -split '[\\/]') -contains '..')) {
        Add-PlanError "affectedFiles path must be project-relative and cannot contain '..': $file"
    }
    [void]$affectedSet.Add([string]$file)
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
        if (-not $affectedSet.Contains([string]$file)) {
            Add-PlanError "Step '$($step.id)' uses a file outside affectedFiles: $file"
        } else {
            [void]$coveredFiles.Add([string]$file)
        }
    }
}
foreach ($file in $affectedFiles) {
    if (-not $coveredFiles.Contains([string]$file)) { Add-PlanError "affectedFiles entry is not covered by a step: $file" }
}

if ((Get-NonNullCount $plan.constraints) -eq 0) { Add-PlanError 'constraints must contain at least one item' }
if ((Get-NonNullCount $plan.acceptance) -eq 0) { Add-PlanError 'acceptance must contain at least one item' }
if ((Get-NonNullCount $plan.stopConditions) -eq 0) { Add-PlanError 'stopConditions must contain at least one item' }

if ($errors.Count -gt 0) {
    foreach ($message in $errors) { [Console]::Error.WriteLine("ERROR: $message") }
    exit 1
}

Write-Output "VALID: $resolvedPlan"
exit 0
