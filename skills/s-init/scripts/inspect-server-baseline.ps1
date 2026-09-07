param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillRoot = Split-Path -Parent $scriptRoot
$skillsRoot = Split-Path -Parent $skillRoot
$codexRoot = Split-Path -Parent $skillsRoot
$repoRoot = Split-Path -Parent $codexRoot
$gamesRoot = Join-Path $repoRoot 'games'
$serverRoot = Join-Path $gamesRoot 'Server'

function Has-Text([string]$Value) {
    return -not [string]::IsNullOrWhiteSpace($Value)
}

function Get-CanonicalPath([string]$Value) {
    if (-not (Has-Text $Value)) { return $null }
    return ([IO.Path]::GetFullPath($Value)).TrimEnd([char[]]@(
        [IO.Path]::DirectorySeparatorChar,
        [IO.Path]::AltDirectorySeparatorChar
    ))
}

function Test-PathEqual([string]$Left, [string]$Right) {
    return (Has-Text $Left) -and (Has-Text $Right) -and
        $Left.Equals($Right, [StringComparison]::OrdinalIgnoreCase)
}

function Test-ReparsePoint([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    return ((Get-Item -LiteralPath $Path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
}

function Get-ReparsePointOnPath([string]$Root, [string]$Candidate) {
    $canonicalRoot = Get-CanonicalPath $Root
    $canonicalCandidate = Get-CanonicalPath $Candidate
    if (-not (Has-Text $canonicalRoot) -or -not (Has-Text $canonicalCandidate)) { return $null }
    $rootWithSeparator = "$canonicalRoot$([IO.Path]::DirectorySeparatorChar)"
    if (-not $canonicalCandidate.StartsWith($rootWithSeparator, [StringComparison]::OrdinalIgnoreCase) -and
        -not (Test-PathEqual $canonicalRoot $canonicalCandidate)) {
        return $null
    }

    $relative = $canonicalCandidate.Substring($canonicalRoot.Length).TrimStart(
        [IO.Path]::DirectorySeparatorChar,
        [IO.Path]::AltDirectorySeparatorChar
    )
    $cursor = $canonicalRoot
    if (Test-ReparsePoint $cursor) { return $cursor }
    foreach ($segment in ($relative -split '[\\/]')) {
        if (-not (Has-Text $segment)) { continue }
        $cursor = Join-Path $cursor $segment
        if (-not (Test-Path -LiteralPath $cursor)) { break }
        if (Test-ReparsePoint $cursor) { return $cursor }
    }
    return $null
}

function Stop-Baseline([string]$Status, [string]$Message, [int]$Code = 1) {
    [pscustomobject]@{
        schemaVersion = 1
        status = $Status
        message = $Message
    } | ConvertTo-Json -Compress
    exit $Code
}

function Get-OrdinaryFiles([string]$Root) {
    $files = [System.Collections.Generic.List[object]]::new()
    $reparsePoints = [System.Collections.Generic.List[string]]::new()
    $pending = [System.Collections.Generic.Queue[string]]::new()
    $pending.Enqueue($Root)

    while ($pending.Count -gt 0) {
        $directory = $pending.Dequeue()
        try {
            $entries = [IO.Directory]::EnumerateFileSystemEntries($directory)
        } catch {
            throw "could not enumerate runner source directory: $directory"
        }
        foreach ($entry in $entries) {
            $item = Get-Item -LiteralPath $entry -Force
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                $reparsePoints.Add((Get-CanonicalPath $item.FullName))
                continue
            }
            if ($item.PSIsContainer) {
                if ($item.Name -notin @(
                    '.git', 'vendor', 'node_modules', 'build', 'dist', 'bin',
                    'tmp', 'temp', 'coverage', 'generated', '.cache'
                )) {
                    $pending.Enqueue($item.FullName)
                }
                continue
            }
            $files.Add($item)
        }
    }

    return [pscustomobject]@{
        files = @($files)
        reparsePoints = @($reparsePoints)
    }
}

function Get-RelativePath([string]$Root, [string]$Path) {
    $relative = $Path.Substring($Root.Length).TrimStart(
        [IO.Path]::DirectorySeparatorChar,
        [IO.Path]::AltDirectorySeparatorChar
    )
    return $relative.Replace('\', '/')
}

function Get-NonCommentModuleName([string]$GoModPath) {
    $content = Get-Content -LiteralPath $GoModPath -Raw -Encoding UTF8
    foreach ($line in ($content -split '\r?\n')) {
        if ($line -match '^\s*module\s+(?<name>[^\s/][^\s]*)\s*(?://.*)?$') {
            return $Matches['name']
        }
    }
    return $null
}

function Test-ConfigurationFile([string]$Path) {
    $extension = [IO.Path]::GetExtension($Path)
    if ($extension -notin @('.json', '.yaml', '.yml', '.toml')) { return $false }
    try {
        $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
        if ([string]::IsNullOrWhiteSpace($content)) { return $false }
        if ($extension -eq '.json') {
            $null = $content | ConvertFrom-Json -ErrorAction Stop
            return $true
        }
        if ($extension -in @('.yaml', '.yml')) {
            return $content -match '(?m)^\s*[^#\s][^:]*:\s*(?:\S|$)'
        }
        return $content -match '(?m)^\s*(?:\[[^\]]+\]|[A-Za-z0-9_.-]+\s*=)'
    } catch {
        return $false
    }
}

function Get-GoPackageName([string]$Content) {
    $packageMatch = [regex]::Match($Content, '(?m)^\s*package\s+(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*$')
    if ($packageMatch.Success) { return $packageMatch.Groups['name'].Value }
    return $null
}

function Test-GeneratedGoFile([string]$Content) {
    return $Content -match '(?mi)^\s*//\s*Code generated .* DO NOT EDIT\.\s*$'
}

function Test-AuditableGoDeclaration([string]$Content) {
    return $Content -match '(?m)^\s*(?:func|type)\s+[A-Za-z_][A-Za-z0-9_]*\b'
}

$canonicalRepoRoot = Get-CanonicalPath $repoRoot
$canonicalGamesRoot = Get-CanonicalPath $gamesRoot
$canonicalProject = Get-CanonicalPath $ProjectPath
if (-not (Has-Text $canonicalProject) -or
    -not (Test-Path -LiteralPath $canonicalProject -PathType Container)) {
    Stop-Baseline 'INVALID' 'target project must be an existing directory'
}
if (-not (Test-PathEqual (Get-CanonicalPath (Split-Path -Parent $canonicalProject)) $canonicalGamesRoot)) {
    Stop-Baseline 'INVALID' 'target project must be a direct child of the repository games directory'
}
$unsafeProjectPath = Get-ReparsePointOnPath $canonicalGamesRoot $canonicalProject
if (Has-Text $unsafeProjectPath) {
    Stop-Baseline 'INVALID' "target project cannot traverse a reparse point: $unsafeProjectPath"
}
$projectName = Split-Path -Leaf $canonicalProject
if ($projectName -notmatch '^slot-fe-(?<slug>[A-Za-z0-9][A-Za-z0-9_-]*)$') {
    Stop-Baseline 'INVALID' 'target project name must match slot-fe-{replicationId}'
}
$replicationId = $Matches.slug

$canonicalServerRoot = Get-CanonicalPath $serverRoot
if (-not (Test-Path -LiteralPath $canonicalServerRoot -PathType Container)) {
    Stop-Baseline 'INVALID' "expected Server root does not exist: $canonicalServerRoot"
}
if (Test-ReparsePoint $canonicalServerRoot) {
    Stop-Baseline 'INVALID' 'Server root cannot be a reparse point'
}
$runnerPath = Get-CanonicalPath (Join-Path $canonicalServerRoot "slot-be-runner-$replicationId")
if (-not (Test-PathEqual (Get-CanonicalPath (Split-Path -Parent $runnerPath)) $canonicalServerRoot)) {
    Stop-Baseline 'INVALID' 'runner path escaped the Server root'
}
if (-not (Test-Path -LiteralPath $runnerPath)) {
    Stop-Baseline 'NEEDS_SERVER_BASE_CODE' 'runner directory is absent; clone or restore the target runner before s_ser'
}
if (-not (Test-Path -LiteralPath $runnerPath -PathType Container)) {
    Stop-Baseline 'INVALID' 'runner path must be a directory'
}
$unsafeRunnerPath = Get-ReparsePointOnPath $canonicalServerRoot $runnerPath
if (Has-Text $unsafeRunnerPath) {
    Stop-Baseline 'INVALID' "runner path cannot traverse a reparse point: $unsafeRunnerPath"
}

$goModPath = Join-Path $runnerPath 'go.mod'
if (Test-Path -LiteralPath $goModPath -PathType Container) {
    Stop-Baseline 'INVALID' 'runner go.mod must be an ordinary file'
}
$unsafeGoModPath = Get-ReparsePointOnPath $runnerPath $goModPath
if (Has-Text $unsafeGoModPath) {
    Stop-Baseline 'INVALID' "runner go.mod cannot traverse a reparse point: $unsafeGoModPath"
}

$missing = [System.Collections.Generic.List[string]]::new()
$checks = [ordered]@{}
$moduleName = $null
if (-not (Test-Path -LiteralPath $goModPath -PathType Leaf)) {
    $missing.Add('go.mod')
    $checks.goModule = [pscustomobject]@{ status = 'MISSING'; path = $goModPath; module = $null }
} else {
    $moduleName = Get-NonCommentModuleName $goModPath
    if (-not (Has-Text $moduleName)) {
        Stop-Baseline 'INVALID' 'runner go.mod must declare a module path'
    }
    $checks.goModule = [pscustomobject]@{ status = 'READY'; path = $goModPath; module = $moduleName }
}

try {
    $sourceInventory = Get-OrdinaryFiles $runnerPath
} catch {
    Stop-Baseline 'INVALID' $_.Exception.Message
}
if ($sourceInventory.reparsePoints.Count -gt 0) {
    Stop-Baseline 'INVALID' "runner source inventory found a reparse point: $($sourceInventory.reparsePoints[0])"
}

$goFiles = @($sourceInventory.files | Where-Object { $_.Extension.Equals('.go', [StringComparison]::OrdinalIgnoreCase) })
$entrypoints = [System.Collections.Generic.List[string]]::new()
$targetModuleEvidence = [System.Collections.Generic.List[object]]::new()
foreach ($goFile in $goFiles) {
    $relativePath = Get-RelativePath $runnerPath $goFile.FullName
    $content = Get-Content -LiteralPath $goFile.FullName -Raw -Encoding UTF8
    $isEvidenceSource = $goFile.Name -notmatch '(?i)_test\.go$' -and -not (Test-GeneratedGoFile $content)
    if ($isEvidenceSource -and
        $content -match '(?m)^\s*package\s+main\s*$' -and
        $content -match '(?m)^\s*func\s+main\s*\(') {
        $entrypoints.Add($relativePath)
    }
    if ($isEvidenceSource -and (Has-Text (Get-GoPackageName $content))) {
        $hasRegistration = $content -match '(?i)\b(?:boot\.Run|NewSlotGameRunnerFunc|NewRunner|Register|BaseGame)\b'
        $hasDeclaration = Test-AuditableGoDeclaration $content
        $isGameModulePath = $relativePath -match '(?i)(^|/)(?:game|v1)(?:/|$)'
        $isInternalGameModule = $relativePath -match '(?i)(^|/)internal(?:/|$)' -and
            ($relativePath -match '(?i)(?:game|runner|slot)' -or $content -match '(?i)\b(?:game|runner|slot)\b')
        if ($hasRegistration) {
            $targetModuleEvidence.Add([pscustomobject]@{ type = 'go-registration'; path = $relativePath })
        } elseif ($hasDeclaration -and ($isGameModulePath -or $isInternalGameModule)) {
            $targetModuleEvidence.Add([pscustomobject]@{ type = 'game-module-source'; path = $relativePath })
        }
    }
}

if ($entrypoints.Count -eq 0) {
    $missing.Add('Go startup entrypoint (package main with func main)')
    $checks.startupEntrypoint = [pscustomobject]@{ status = 'MISSING'; paths = @() }
} else {
    $checks.startupEntrypoint = [pscustomobject]@{ status = 'READY'; paths = @($entrypoints) }
}

$rootConfigNames = @(
    'scheme.json', 'scheme.yaml', 'scheme.yml', 'scheme.toml',
    'config.json', 'config.yaml', 'config.yml', 'config.toml',
    'settings.json', 'settings.yaml', 'settings.yml', 'settings.toml'
)
$configurationEvidence = [System.Collections.Generic.List[string]]::new()
foreach ($name in $rootConfigNames) {
    $candidate = Join-Path $runnerPath $name
    if (Test-Path -LiteralPath $candidate -PathType Container) {
        Stop-Baseline 'INVALID' "runner configuration candidate must be a file: $candidate"
    }
    $unsafeCandidate = Get-ReparsePointOnPath $runnerPath $candidate
    if (Has-Text $unsafeCandidate) {
        Stop-Baseline 'INVALID' "runner configuration candidate cannot traverse a reparse point: $unsafeCandidate"
    }
    if ((Test-Path -LiteralPath $candidate -PathType Leaf) -and (Test-ConfigurationFile $candidate)) {
        $configurationEvidence.Add((Get-RelativePath $runnerPath $candidate))
    }
}
foreach ($directoryName in @('scheme', 'config', 'configs', 'settings')) {
    $candidate = Join-Path $runnerPath $directoryName
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
        Stop-Baseline 'INVALID' "runner configuration root must be a directory: $candidate"
    }
    $unsafeCandidate = Get-ReparsePointOnPath $runnerPath $candidate
    if (Has-Text $unsafeCandidate) {
        Stop-Baseline 'INVALID' "runner configuration root cannot traverse a reparse point: $unsafeCandidate"
    }
    if (Test-Path -LiteralPath $candidate -PathType Container) {
        $ordinaryFiles = @($sourceInventory.files | Where-Object {
            $_.FullName.StartsWith("$candidate$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase) -and
            (Test-ConfigurationFile $_.FullName)
        })
        if ($ordinaryFiles.Count -gt 0) {
            $configurationEvidence.Add("$directoryName/")
        }
    }
}
if ($configurationEvidence.Count -eq 0) {
    $missing.Add('root configuration or scheme evidence')
    $checks.configuration = [pscustomobject]@{ status = 'MISSING'; paths = @() }
} else {
    $checks.configuration = [pscustomobject]@{ status = 'READY'; paths = @($configurationEvidence) }
}

if ($targetModuleEvidence.Count -eq 0) {
    $missing.Add('runner game registration or module evidence')
    $checks.gameRegistrationOrModule = [pscustomobject]@{ status = 'MISSING'; replicationId = $replicationId; evidence = @() }
} else {
    $checks.gameRegistrationOrModule = [pscustomobject]@{ status = 'READY'; replicationId = $replicationId; evidence = @($targetModuleEvidence) }
}

$status = if ($missing.Count -eq 0) { 'READY' } else { 'NEEDS_SERVER_BASE_CODE' }
[pscustomobject]@{
    schemaVersion = 1
    status = $status
    message = if ($status -eq 'READY') {
        'runner baseline source evidence is present; this does not prove build success, gameplay rules, protocol compatibility, or s_ser acceptance'
    } else {
        'runner baseline source evidence is incomplete: ' + ($missing -join '; ')
    }
    runnerPath = $runnerPath
    replicationId = $replicationId
    checks = [pscustomobject]$checks
    missing = @($missing)
    buildExecuted = $false
    gameplayVerified = $false
} | ConvertTo-Json -Depth 7

if ($status -eq 'READY') { exit 0 }
exit 1
