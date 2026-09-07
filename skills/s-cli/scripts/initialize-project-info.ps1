[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath,
    [string]$CompetitorUrl,
    [string]$GameId,
    [Parameter(DontShow = $true)]
    [switch]$AllowMissingResourceForSInit
)

$ErrorActionPreference = 'Stop'
$skillRoot = Split-Path -Parent $PSScriptRoot
$skillsRoot = Split-Path -Parent $skillRoot
$codexRoot = Split-Path -Parent $skillsRoot
$repoRoot = Split-Path -Parent $codexRoot
$gamesRoot = Join-Path $repoRoot 'games'

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

function Test-PathEqual([string]$Left, [string]$Right) {
    return $Left.Equals($Right, [StringComparison]::OrdinalIgnoreCase)
}

function Test-ReparsePoint([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    $item = Get-Item -LiteralPath $Path -Force
    return ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
}

function Get-ReparsePointOnPath([string]$Root, [string]$Candidate) {
    $rootPath = Get-CanonicalPath $Root
    $candidatePath = Get-CanonicalPath $Candidate
    $rootPrefix = "$rootPath$([IO.Path]::DirectorySeparatorChar)"
    if (-not (Test-PathEqual $candidatePath $rootPath) -and
        -not $candidatePath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        return $null
    }

    $cursor = $rootPath
    if (Test-ReparsePoint $cursor) { return $cursor }
    $relative = $candidatePath.Substring($rootPath.Length).TrimStart([char[]]@('\', '/'))
    foreach ($segment in ($relative -split '[\\/]')) {
        if (-not (Has-Text $segment)) { continue }
        $cursor = Join-Path $cursor $segment
        if (-not (Test-Path -LiteralPath $cursor)) { break }
        if (Test-ReparsePoint $cursor) { return $cursor }
    }
    return $null
}

function Get-ResourceInventory([string]$Root) {
    $ordinaryFileCount = 0
    $firstReparsePoint = $null
    $pending = [System.Collections.Generic.Stack[string]]::new()
    $pending.Push($Root)

    while ($pending.Count -gt 0) {
        $directory = $pending.Pop()
        foreach ($item in (Get-ChildItem -LiteralPath $directory -Force)) {
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                if (-not (Has-Text $firstReparsePoint)) { $firstReparsePoint = $item.FullName }
                continue
            }
            if ($item.PSIsContainer) {
                $pending.Push($item.FullName)
            } else {
                $ordinaryFileCount++
            }
        }
    }

    return [pscustomobject]@{
        ordinaryFileCount = $ordinaryFileCount
        firstReparsePoint = $firstReparsePoint
    }
}

function Stop-Invalid([string]$Message) {
    Write-Output "INVALID_PROJECT_INFO_INPUT: $Message"
    exit 1
}

function Test-GameId([string]$Value) {
    return (Has-Text $Value) -and $Value -match '^[A-Za-z0-9][A-Za-z0-9_-]*$'
}

$canonicalGamesRoot = Get-CanonicalPath $gamesRoot
$canonicalProject = Get-CanonicalPath $ProjectPath
if (-not (Has-Text $canonicalProject) -or
    -not (Test-Path -LiteralPath $canonicalProject -PathType Container)) {
    Stop-Invalid 'target project must be an existing directory'
}
if (-not (Test-PathEqual (Get-CanonicalPath (Split-Path -Parent $canonicalProject)) $canonicalGamesRoot)) {
    Stop-Invalid 'target project must be a direct child of the repository games directory'
}
$unsafeProjectPath = Get-ReparsePointOnPath $canonicalGamesRoot $canonicalProject
if (Has-Text $unsafeProjectPath) {
    Stop-Invalid "target project cannot traverse a reparse point: $unsafeProjectPath"
}

$projectName = Split-Path -Leaf $canonicalProject
if ($projectName -notmatch '^slot-fe-(?<replicationId>[A-Za-z0-9][A-Za-z0-9_-]*)$') {
    Stop-Invalid 'target project name must match slot-fe-{replicationId}'
}
$replicationId = [string]$Matches.replicationId
$resourcesPath = Join-Path $canonicalProject 'assets\resources'
$resourceRoot = Join-Path $resourcesPath "$($replicationId)_res"
$unsafeResourceRoot = Get-ReparsePointOnPath $canonicalProject $resourceRoot
if (Has-Text $unsafeResourceRoot) {
    Stop-Invalid "resource root cannot traverse a reparse point: $unsafeResourceRoot"
}
if (Test-Path -LiteralPath $resourceRoot -PathType Leaf) {
    Stop-Invalid "resource root must be a directory: assets/resources/$($replicationId)_res"
}
$hasResourceRoot = Test-Path -LiteralPath $resourceRoot -PathType Container
if (-not $hasResourceRoot) {
    if (-not $AllowMissingResourceForSInit) {
        Stop-Invalid "missing corresponding resource root: assets/resources/$($replicationId)_res"
    }
} else {
    $resourceInventory = Get-ResourceInventory $resourceRoot
    if (Has-Text $resourceInventory.firstReparsePoint) {
        Stop-Invalid "resource root cannot contain a reparse point: $($resourceInventory.firstReparsePoint)"
    }
    if (-not $AllowMissingResourceForSInit -and $resourceInventory.ordinaryFileCount -eq 0) {
        Stop-Invalid "resource root must contain at least one ordinary file: assets/resources/$($replicationId)_res"
    }
}

$docPath = Join-Path $canonicalProject 'doc'
$projectInfoPath = Join-Path $docPath 'project_info.md'
if (Test-Path -LiteralPath $docPath -PathType Leaf) {
    Stop-Invalid 'doc path must be a directory'
}
$unsafeProjectInfoPath = Get-ReparsePointOnPath $canonicalProject $projectInfoPath
if (Has-Text $unsafeProjectInfoPath) {
    Stop-Invalid "project_info path cannot traverse a reparse point: $unsafeProjectInfoPath"
}
if (Test-Path -LiteralPath $projectInfoPath -PathType Container) {
    Stop-Invalid 'doc/project_info.md is a directory'
}
if (Test-Path -LiteralPath $projectInfoPath -PathType Leaf) {
    Write-Output "EXISTS: $projectInfoPath"
    exit 0
}

$metadataGameId = $replicationId
if (Has-Text $GameId) {
    $metadataGameId = $GameId.Trim()
    if (-not (Test-GameId $metadataGameId)) {
        Stop-Invalid 'gameId may contain only letters, digits, underscores, and hyphens'
    }
}

$urlText = ''
if (Has-Text $CompetitorUrl) {
    $urlText = $CompetitorUrl.Trim()
    $parsedUrl = $null
    if ($urlText -match '[\r\n]' -or
        -not [Uri]::TryCreate($urlText, [UriKind]::Absolute, [ref]$parsedUrl) -or
        @('http', 'https') -notcontains $parsedUrl.Scheme -or
        -not (Has-Text $parsedUrl.Host)) {
        Stop-Invalid 'competitorUrl must be an absolute HTTP(S) URL'
    }
}

$needed = [System.Collections.Generic.List[string]]::new()
if (-not (Has-Text $urlText)) { $needed.Add('competitorUrl') }
if ($needed.Count -gt 0) {
    Write-Output "NEEDS_PROJECT_INFO_INPUT: $($needed -join ', ')"
    exit 2
}

[IO.Directory]::CreateDirectory($docPath) | Out-Null
$unsafeProjectInfoPath = Get-ReparsePointOnPath $canonicalProject $projectInfoPath
if (Has-Text $unsafeProjectInfoPath) {
    Stop-Invalid "project_info path cannot traverse a reparse point: $unsafeProjectInfoPath"
}
if (Test-Path -LiteralPath $projectInfoPath) {
    Write-Output "EXISTS: $projectInfoPath"
    exit 0
}

$projectPathValue = $canonicalProject -replace '\\', '/'
$targetProject = Split-Path -Leaf $canonicalProject
$content = @"
# Project Info

- gameId: $metadataGameId
- competitorUrl: $urlText
- projectPath: $projectPathValue
- targetProject: $targetProject
"@
$temporaryPath = Join-Path $docPath ('.project_info.{0}.tmp' -f ([guid]::NewGuid().ToString('N')))
try {
    $utf8NoBom = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($temporaryPath, ($content.TrimEnd() + [Environment]::NewLine), $utf8NoBom)
    [IO.File]::Move($temporaryPath, $projectInfoPath)
} catch {
    if (Test-Path -LiteralPath $projectInfoPath -PathType Leaf) {
        Write-Output "EXISTS: $projectInfoPath"
        exit 0
    }
    Stop-Invalid "failed to create doc/project_info.md: $($_.Exception.Message)"
} finally {
    if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) {
        [IO.File]::Delete($temporaryPath)
    }
}

Write-Output "CREATED: $projectInfoPath"
