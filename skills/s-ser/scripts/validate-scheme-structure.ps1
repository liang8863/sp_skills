[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RunnerPath,
    [string]$GameCode,
    [string]$SchemeRepositoryPath
)

$ErrorActionPreference = 'Stop'
$trialLabel = -join @([char]0x8BD5, [char]0x73A9, [char]0x7248)
$trialDirectoryName = $trialLabel + 'json'

function Has-Text([string]$Value) {
    return -not [string]::IsNullOrWhiteSpace($Value)
}

function Get-CanonicalPath([string]$Value) {
    try {
        return ([IO.Path]::GetFullPath($Value)).TrimEnd([char[]]@(
            [IO.Path]::DirectorySeparatorChar,
            [IO.Path]::AltDirectorySeparatorChar
        ))
    } catch {
        return ''
    }
}

function Stop-Validation([string]$Status, [string]$Message, [hashtable]$Details = @{}) {
    $result = [ordered]@{
        schemaVersion = 3
        status = $Status
        message = $Message
    }
    foreach ($key in $Details.Keys) {
        $result[$key] = $Details[$key]
    }
    $result | ConvertTo-Json -Depth 12
    exit 1
}

function Invoke-GitCommand([string]$RepositoryPath, [string[]]$Arguments) {
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = @(& $script:GitExecutable -C $RepositoryPath @Arguments 2>&1)
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    return [pscustomobject]@{
        ExitCode = $exitCode
        Output = @($output | ForEach-Object { $_.ToString() })
    }
}

function Get-LastOutputLine($Result) {
    $lines = @($Result.Output | ForEach-Object { $_.Trim() } | Where-Object { Has-Text $_ })
    if ($lines.Count -eq 0) { return '' }
    return $lines[-1]
}

function Get-JsonKind([object]$Value) {
    if ($null -eq $Value) { return 'null' }
    if ($Value -is [pscustomobject] -or $Value -is [System.Collections.IDictionary]) { return 'object' }
    if ($Value -is [System.Collections.IList] -and $Value -isnot [string]) { return 'array' }
    if ($Value -is [bool]) { return 'boolean' }
    if ($Value -is [string]) { return 'string' }
    if ($Value -is [byte] -or $Value -is [sbyte] -or
        $Value -is [int16] -or $Value -is [uint16] -or
        $Value -is [int32] -or $Value -is [uint32] -or
        $Value -is [int64] -or $Value -is [uint64] -or
        $Value -is [single] -or $Value -is [double] -or
        $Value -is [decimal]) {
        return 'number'
    }
    return $Value.GetType().FullName
}

function Add-Difference(
    [System.Collections.Generic.List[object]]$Differences,
    [string]$Path,
    [string]$Expected,
    [string]$Actual
) {
    if ($Differences.Count -lt 200) {
        $Differences.Add([ordered]@{
            path = $Path
            expected = $Expected
            actual = $Actual
        })
    }
}

function Compare-JsonStructure(
    [object]$ReferenceValue,
    [object]$SchemeValue,
    [string]$Path,
    [System.Collections.Generic.List[object]]$Differences
) {
    $referenceKind = Get-JsonKind $ReferenceValue
    $schemeKind = Get-JsonKind $SchemeValue
    if ($referenceKind -cne $schemeKind) {
        Add-Difference $Differences $Path $referenceKind $schemeKind
        return
    }

    if ($referenceKind -ceq 'object') {
        $referenceProperties = @($ReferenceValue.PSObject.Properties)
        $schemeProperties = @($SchemeValue.PSObject.Properties)

        foreach ($property in $referenceProperties) {
            $matches = @($schemeProperties | Where-Object { $_.Name -ceq $property.Name })
            $propertyPath = "$Path.$($property.Name)"
            if ($matches.Count -eq 0) {
                Add-Difference $Differences $propertyPath 'property' 'missing'
                continue
            }
            Compare-JsonStructure $property.Value $matches[0].Value $propertyPath $Differences
        }

        foreach ($property in $schemeProperties) {
            if (@($referenceProperties | Where-Object { $_.Name -ceq $property.Name }).Count -eq 0) {
                Add-Difference $Differences "$Path.$($property.Name)" 'missing' 'extra property'
            }
        }
        return
    }

    if ($referenceKind -ceq 'array') {
        if ($ReferenceValue.Count -ne $SchemeValue.Count) {
            Add-Difference $Differences $Path "array length $($ReferenceValue.Count)" "array length $($SchemeValue.Count)"
        }
        $sharedLength = [Math]::Min($ReferenceValue.Count, $SchemeValue.Count)
        for ($index = 0; $index -lt $sharedLength; $index++) {
            Compare-JsonStructure $ReferenceValue[$index] $SchemeValue[$index] "$Path[$index]" $Differences
        }
    }
}

$canonicalRunner = Get-CanonicalPath $RunnerPath
if (-not (Has-Text $canonicalRunner) -or -not (Test-Path -LiteralPath $canonicalRunner -PathType Container)) {
    Stop-Validation 'NEEDS_RUNNER' "runner path does not exist: $RunnerPath"
}

$runnerName = Split-Path -Leaf $canonicalRunner
if (-not (Has-Text $GameCode)) {
    if ($runnerName -notmatch '^slot-be-runner-(?<code>[A-Za-z0-9][A-Za-z0-9_-]*)$') {
        Stop-Validation 'NEEDS_SCHEME_REFERENCE' 'GameCode is required when the runner directory does not follow slot-be-runner-{code}'
    }
    $GameCode = $Matches['code'].ToUpperInvariant()
}
if ($GameCode -notmatch '^[A-Za-z0-9][A-Za-z0-9_-]*$') {
    Stop-Validation 'NEEDS_SCHEME_REFERENCE' 'GameCode may contain only letters, digits, underscores, and hyphens'
}

$schemePath = Join-Path $canonicalRunner 'scheme.json'
$runnerSchemePresent = Test-Path -LiteralPath $schemePath -PathType Leaf

if (-not (Has-Text $SchemeRepositoryPath)) {
    $SchemeRepositoryPath = Join-Path (Split-Path -Parent $canonicalRunner) 'slot-rtp-scheme'
}
$canonicalRepository = Get-CanonicalPath $SchemeRepositoryPath
if (-not (Has-Text $canonicalRepository) -or -not (Test-Path -LiteralPath $canonicalRepository -PathType Container)) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' "slot-rtp-scheme repository does not exist; scheme-dependent work needs a user decision: $SchemeRepositoryPath" @{
        gameCode = $GameCode
        schemePath = $schemePath
        referenceRepositoryPath = $canonicalRepository
    }
}

$gitCommand = Get-Command git -ErrorAction SilentlyContinue
if ($null -eq $gitCommand) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'git is required to synchronize slot-rtp-scheme; scheme-dependent work needs a user decision' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
    }
}
$script:GitExecutable = $gitCommand.Source
$gitTop = Invoke-GitCommand $canonicalRepository @('rev-parse', '--show-toplevel')
$gitTopPath = Get-LastOutputLine $gitTop
if ($gitTop.ExitCode -ne 0 -or -not (Has-Text $gitTopPath) -or
    -not (Get-CanonicalPath $gitTopPath).Equals($canonicalRepository, [StringComparison]::OrdinalIgnoreCase)) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'slot-rtp-scheme path must be its own Git top level; scheme-dependent work needs a user decision' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
        gitOutput = $gitTop.Output
    }
}

$remote = Invoke-GitCommand $canonicalRepository @('remote', 'get-url', 'origin')
$referenceRemoteUrl = Get-LastOutputLine $remote
if ($remote.ExitCode -ne 0 -or -not (Has-Text $referenceRemoteUrl)) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'slot-rtp-scheme must have a readable origin remote; scheme-dependent work needs a user decision' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
        gitOutput = $remote.Output
    }
}

$statusBefore = Invoke-GitCommand $canonicalRepository @('status', '--porcelain=v1')
if ($statusBefore.ExitCode -ne 0 -or $statusBefore.Output.Count -gt 0) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'slot-rtp-scheme must be clean before pull; do not modify it automatically' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
        referenceRemoteUrl = $referenceRemoteUrl
        workingTreeEntries = $statusBefore.Output
    }
}

$branchResult = Invoke-GitCommand $canonicalRepository @('symbolic-ref', '--quiet', '--short', 'HEAD')
$referenceBranch = Get-LastOutputLine $branchResult
if ($branchResult.ExitCode -ne 0 -or -not (Has-Text $referenceBranch)) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'slot-rtp-scheme must be on an attached branch; scheme-dependent work needs a user decision' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
        referenceRemoteUrl = $referenceRemoteUrl
    }
}

$upstreamResult = Invoke-GitCommand $canonicalRepository @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')
$referenceUpstream = Get-LastOutputLine $upstreamResult
if ($upstreamResult.ExitCode -ne 0 -or -not $referenceUpstream.StartsWith('origin/', [StringComparison]::Ordinal)) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'slot-rtp-scheme must track an origin branch; scheme-dependent work needs a user decision' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
        referenceRemoteUrl = $referenceRemoteUrl
        referenceBranch = $referenceBranch
        referenceUpstream = $referenceUpstream
        gitOutput = $upstreamResult.Output
    }
}

$commitBeforeResult = Invoke-GitCommand $canonicalRepository @('rev-parse', 'HEAD')
$referenceCommitBeforeSync = Get-LastOutputLine $commitBeforeResult
if ($commitBeforeResult.ExitCode -ne 0 -or -not (Has-Text $referenceCommitBeforeSync)) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'slot-rtp-scheme must have a readable HEAD commit; scheme-dependent work needs a user decision' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
    }
}

$fetchResult = Invoke-GitCommand $canonicalRepository @('fetch', '--prune', 'origin')
if ($fetchResult.ExitCode -ne 0) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'failed to fetch the slot-rtp-scheme origin; scheme-dependent work needs a user decision' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
        referenceRemoteUrl = $referenceRemoteUrl
        referenceBranch = $referenceBranch
        referenceUpstream = $referenceUpstream
        referenceCommitBeforeSync = $referenceCommitBeforeSync
        gitOutput = $fetchResult.Output
    }
}

$divergenceResult = Invoke-GitCommand $canonicalRepository @('rev-list', '--left-right', '--count', "HEAD...$referenceUpstream")
$divergenceLine = Get-LastOutputLine $divergenceResult
$divergenceParts = @($divergenceLine -split '\s+' | Where-Object { Has-Text $_ })
if ($divergenceResult.ExitCode -ne 0 -or $divergenceParts.Count -ne 2) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'failed to compare the local and upstream slot-rtp-scheme branches; scheme-dependent work needs a user decision' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
        referenceBranch = $referenceBranch
        referenceUpstream = $referenceUpstream
        gitOutput = $divergenceResult.Output
    }
}
$referenceAheadBeforeSync = [int]$divergenceParts[0]
$referenceBehindBeforeSync = [int]$divergenceParts[1]
if ($referenceAheadBeforeSync -gt 0) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'slot-rtp-scheme is locally ahead or diverged; do not rebase, reset, or push it automatically' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
        referenceRemoteUrl = $referenceRemoteUrl
        referenceBranch = $referenceBranch
        referenceUpstream = $referenceUpstream
        referenceCommitBeforeSync = $referenceCommitBeforeSync
        referenceAheadBeforeSync = $referenceAheadBeforeSync
        referenceBehindBeforeSync = $referenceBehindBeforeSync
    }
}

if ($referenceBehindBeforeSync -gt 0) {
    $fastForwardResult = Invoke-GitCommand $canonicalRepository @('-c', 'core.hooksPath=NUL', 'merge', '--ff-only', $referenceUpstream)
    if ($fastForwardResult.ExitCode -ne 0) {
        Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'failed to fast-forward slot-rtp-scheme; do not repair it automatically' @{
            gameCode = $GameCode
            referenceRepositoryPath = $canonicalRepository
            referenceRemoteUrl = $referenceRemoteUrl
            referenceBranch = $referenceBranch
            referenceUpstream = $referenceUpstream
            referenceCommitBeforeSync = $referenceCommitBeforeSync
            referenceAheadBeforeSync = $referenceAheadBeforeSync
            referenceBehindBeforeSync = $referenceBehindBeforeSync
            gitOutput = $fastForwardResult.Output
        }
    }
}

$commitAfterResult = Invoke-GitCommand $canonicalRepository @('rev-parse', 'HEAD')
$referenceCommit = Get-LastOutputLine $commitAfterResult
$statusAfter = Invoke-GitCommand $canonicalRepository @('status', '--porcelain=v1')
$referenceDirty = $statusAfter.ExitCode -ne 0 -or $statusAfter.Output.Count -gt 0
if ($commitAfterResult.ExitCode -ne 0 -or -not (Has-Text $referenceCommit) -or $referenceDirty) {
    Stop-Validation 'NEEDS_SCHEME_SYNC_DECISION' 'slot-rtp-scheme is not clean after synchronization; do not modify it automatically' @{
        gameCode = $GameCode
        referenceRepositoryPath = $canonicalRepository
        referenceRemoteUrl = $referenceRemoteUrl
        referenceBranch = $referenceBranch
        referenceUpstream = $referenceUpstream
        referenceCommitBeforeSync = $referenceCommitBeforeSync
        referenceCommit = $referenceCommit
        referenceAheadBeforeSync = $referenceAheadBeforeSync
        referenceBehindBeforeSync = $referenceBehindBeforeSync
        workingTreeEntries = $statusAfter.Output
    }
}
$referencePulled = $referenceCommitBeforeSync -cne $referenceCommit

$syncDetails = @{
    referenceRepositoryPath = $canonicalRepository
    referenceRemoteUrl = $referenceRemoteUrl
    referenceBranch = $referenceBranch
    referenceUpstream = $referenceUpstream
    referenceSyncStrategy = 'fetch-prune+merge-ff-only'
    referenceCommitBeforeSync = $referenceCommitBeforeSync
    referenceCommit = $referenceCommit
    referenceAheadBeforeSync = $referenceAheadBeforeSync
    referenceBehindBeforeSync = $referenceBehindBeforeSync
    referencePulled = $referencePulled
    referenceDirty = $false
}

$trialRoot = Join-Path $canonicalRepository $trialDirectoryName
if (-not (Test-Path -LiteralPath $trialRoot -PathType Container)) {
    Stop-Validation 'NEEDS_SCHEME_REFERENCE_DECISION' 'trial-scheme directory is absent after synchronization; scheme-dependent work needs a user decision' (@{
        gameCode = $GameCode
        schemePath = $schemePath
        trialRoot = $trialRoot
    } + $syncDetails)
}

$prefix = "$GameCode`_"
$suffix = '_' + $trialLabel + '.json'
$references = @(Get-ChildItem -LiteralPath $trialRoot -File -Filter '*.json' | Where-Object {
    $_.Name.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase) -and
    $_.Name.EndsWith($suffix, [StringComparison]::OrdinalIgnoreCase)
})
if ($references.Count -eq 0) {
    Stop-Validation 'NEEDS_SCHEME_REFERENCE_DECISION' "no corresponding trial JSON exists for $GameCode after synchronization; scheme-dependent work needs a user decision" (@{
        gameCode = $GameCode
        trialRoot = $trialRoot
        candidates = @()
    } + $syncDetails)
}
if ($references.Count -gt 1) {
    Stop-Validation 'NEEDS_SCHEME_REFERENCE' "expected exactly one trial JSON for $GameCode, found $($references.Count); scheme-dependent work needs a user decision" (@{
        gameCode = $GameCode
        trialRoot = $trialRoot
        candidates = @($references | ForEach-Object { $_.FullName })
    } + $syncDetails)
}
$referencePath = $references[0].FullName

try {
    $referenceJson = Get-Content -LiteralPath $referencePath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Stop-Validation 'NEEDS_SCHEME_REFERENCE' "reference JSON is invalid; scheme-dependent work needs a user decision: $($_.Exception.Message)" (@{
        gameCode = $GameCode
        referencePath = $referencePath
    } + $syncDetails)
}
$referenceHash = (Get-FileHash -LiteralPath $referencePath -Algorithm SHA256).Hash.ToLowerInvariant()

if (-not $runnerSchemePresent) {
    [ordered]@{
        schemaVersion = 3
        status = 'VALID'
        validationMode = 'REFERENCE_FALLBACK'
        gameCode = $GameCode
        runnerPath = $canonicalRunner
        runnerSchemePresent = $false
        structureCompared = $false
        schemeSource = 'slot-rtp-scheme'
        schemePath = $null
        expectedRunnerSchemePath = $schemePath
        schemeSha256 = $null
        effectiveSchemePath = $referencePath
        referenceRepositoryPath = $canonicalRepository
        referenceRemoteUrl = $referenceRemoteUrl
        referenceBranch = $referenceBranch
        referenceUpstream = $referenceUpstream
        referenceSyncStrategy = 'fetch-prune+merge-ff-only'
        referenceCommitBeforeSync = $referenceCommitBeforeSync
        referenceCommit = $referenceCommit
        referenceAheadBeforeSync = $referenceAheadBeforeSync
        referenceBehindBeforeSync = $referenceBehindBeforeSync
        referencePulled = $referencePulled
        referenceDirty = $false
        referencePath = $referencePath
        referenceSha256 = $referenceHash
        differenceCount = 0
    } | ConvertTo-Json -Depth 6
    exit 0
}

try {
    $schemeJson = Get-Content -LiteralPath $schemePath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Stop-Validation 'SCHEME_STRUCTURE_MISMATCH' "runner scheme.json is invalid: $($_.Exception.Message)" (@{
        gameCode = $GameCode
        schemePath = $schemePath
        referencePath = $referencePath
    } + $syncDetails)
}

$differences = [System.Collections.Generic.List[object]]::new()
Compare-JsonStructure $referenceJson $schemeJson '$' $differences
$schemeHash = (Get-FileHash -LiteralPath $schemePath -Algorithm SHA256).Hash.ToLowerInvariant()

if ($differences.Count -gt 0) {
    Stop-Validation 'SCHEME_STRUCTURE_MISMATCH' 'scheme.json does not match the corresponding trial JSON structure' (@{
        gameCode = $GameCode
        schemePath = $schemePath
        schemeSha256 = $schemeHash
        referencePath = $referencePath
        referenceSha256 = $referenceHash
        differenceCount = $differences.Count
        differences = @($differences)
    } + $syncDetails)
}

[ordered]@{
    schemaVersion = 3
    status = 'VALID'
    validationMode = 'STRUCTURE_COMPARISON'
    gameCode = $GameCode
    runnerPath = $canonicalRunner
    runnerSchemePresent = $true
    structureCompared = $true
    schemeSource = 'runner'
    schemePath = $schemePath
    schemeSha256 = $schemeHash
    effectiveSchemePath = $schemePath
    referenceRepositoryPath = $canonicalRepository
    referenceRemoteUrl = $referenceRemoteUrl
    referenceBranch = $referenceBranch
    referenceUpstream = $referenceUpstream
    referenceSyncStrategy = 'fetch-prune+merge-ff-only'
    referenceCommitBeforeSync = $referenceCommitBeforeSync
    referenceCommit = $referenceCommit
    referenceAheadBeforeSync = $referenceAheadBeforeSync
    referenceBehindBeforeSync = $referenceBehindBeforeSync
    referencePulled = $referencePulled
    referenceDirty = $false
    referencePath = $referencePath
    referenceSha256 = $referenceHash
    differenceCount = 0
} | ConvertTo-Json -Depth 6
