[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath,
    [switch]$DryRun,
    [Parameter(DontShow = $true)]
    [string]$GitExecutable = 'git',
    [Parameter(DontShow = $true)]
    [ValidateRange(1, 600)]
    [int]$CloneTimeoutSeconds = 180
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

function Get-MarkdownScalar([string]$Value) {
    $text = $Value.Trim()
    if ($text.Length -ge 2 -and
        (($text[0] -eq [char]96 -and $text[$text.Length - 1] -eq [char]96) -or
         ($text[0] -eq [char]34 -and $text[$text.Length - 1] -eq [char]34) -or
         ($text[0] -eq [char]39 -and $text[$text.Length - 1] -eq [char]39))) {
        return $text.Substring(1, $text.Length - 2).Trim()
    }
    return $text
}

function Stop-Runner([string]$Status, [string]$Message, [int]$Code = 1) {
    [pscustomobject]@{
        schemaVersion = 1
        status = $Status
        message = $Message
    } | ConvertTo-Json -Compress
    exit $Code
}

function Protect-SensitiveText([string]$Text) {
    if (-not (Has-Text $Text)) { return '' }

    $redacted = [regex]::Replace(
        $Text,
        '(?i)\b(https?://)[^/\s?#@]+@',
        '$1<redacted>@'
    )
    $redacted = [regex]::Replace(
        $redacted,
        '(?i)(https?://[^\s?#''"]+)[?#][^\s''"]*',
        '$1?<redacted>'
    )
    $redacted = [regex]::Replace(
        $redacted,
        '(?i)\b(token|access_token|auth|authorization|signature|sig|secret|key)\s*[:=]\s*(?:"[^"]*"|''[^'']*''|[^\s&,;]+)',
        '$1=<redacted>'
    )
    $redacted = [regex]::Replace(
        $redacted,
        '(?i)(authorization\s*:\s*(?:bearer\s+)?)[^\s]+',
        '$1<redacted>'
    )
    $redacted = ($redacted -replace '[\r\n]+', ' ').Trim()
    if ($redacted.Length -gt 600) {
        return $redacted.Substring(0, 600) + '...'
    }
    return $redacted
}

function Get-GitFailureSummary($Result) {
    $lines = @($Result.Lines |
        Where-Object {
            if (-not (Has-Text $_)) { return $false }
            $line = $_.Trim()
            return $line -ne '#< CLIXML' -and
                $line -notmatch '^<Objs(?:\s|>)' -and
                $line -notmatch '^</Objs>'
        } |
        Select-Object -Last 3)
    if ($lines.Count -eq 0) { return 'no diagnostic output' }
    return Protect-SensitiveText ($lines -join ' | ')
}

function Invoke-Git([string[]]$Arguments) {
    $previousErrorAction = $ErrorActionPreference
    $previousOptionalLocks = [Environment]::GetEnvironmentVariable('GIT_OPTIONAL_LOCKS', 'Process')
    try {
        [Environment]::SetEnvironmentVariable('GIT_OPTIONAL_LOCKS', '0', 'Process')
        $ErrorActionPreference = 'Continue'
        $output = @(& $GitExecutable @Arguments 2>&1)
        $code = $LASTEXITCODE
        return [pscustomobject]@{
            ExitCode = $code
            Lines = @($output | ForEach-Object { $_.ToString() })
        }
    } catch {
        return [pscustomobject]@{
            ExitCode = 127
            Lines = @($_.Exception.Message)
        }
    } finally {
        [Environment]::SetEnvironmentVariable('GIT_OPTIONAL_LOCKS', $previousOptionalLocks, 'Process')
        $ErrorActionPreference = $previousErrorAction
    }
}

function Get-ProcessTreeSnapshot([int]$RootProcessId) {
    $result = [System.Collections.Generic.List[int]]::new()
    $pending = [System.Collections.Generic.Queue[int]]::new()
    $pending.Enqueue($RootProcessId)
    try {
        $processes = @(Get-CimInstance Win32_Process -ErrorAction Stop |
            Select-Object ProcessId, ParentProcessId)
    } catch {
        return [pscustomobject]@{
            Ids = @($RootProcessId)
            EnumerationSucceeded = $false
        }
    }

    while ($pending.Count -gt 0) {
        $parentId = $pending.Dequeue()
        if (-not $result.Contains($parentId)) { $result.Add($parentId) }
        foreach ($child in ($processes | Where-Object { [int]$_.ParentProcessId -eq $parentId })) {
            $childId = [int]$child.ProcessId
            if (-not $result.Contains($childId)) { $pending.Enqueue($childId) }
        }
    }
    return [pscustomobject]@{
        Ids = @($result)
        EnumerationSucceeded = $true
    }
}

function Stop-OwnedProcessTree([int]$RootProcessId) {
    $snapshot = Get-ProcessTreeSnapshot $RootProcessId
    $ownedIds = @($snapshot.Ids)
    $taskkillPath = Join-Path $env:SystemRoot 'System32\taskkill.exe'
    $taskkillSucceeded = $false
    if (Test-Path -LiteralPath $taskkillPath -PathType Leaf) {
        try {
            & $taskkillPath /PID $RootProcessId /T /F *> $null
            $taskkillSucceeded = $LASTEXITCODE -eq 0
        } catch {
            $taskkillSucceeded = $false
        }
    }
    $cleanupSucceeded = [bool]$snapshot.EnumerationSucceeded -and $taskkillSucceeded
    foreach ($processId in ($ownedIds | Sort-Object -Descending)) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
        } catch {
        }
    }
    foreach ($processId in $ownedIds) {
        if (Get-Process -Id $processId -ErrorAction SilentlyContinue) { return $false }
    }
    return $cleanupSucceeded
}

function Invoke-GitClone([string[]]$Arguments, [int]$TimeoutSeconds) {
    $payloadJson = [pscustomobject]@{
        executable = $GitExecutable
        arguments = @($Arguments)
    } | ConvertTo-Json -Compress -Depth 4
    $payload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payloadJson))
    $wrapper = @'
$ErrorActionPreference = 'Continue'
$payloadJson = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($env:S_INIT_GIT_PAYLOAD))
$payload = $payloadJson | ConvertFrom-Json
$gitArguments = @($payload.arguments | ForEach-Object { [string]$_ })
& ([string]$payload.executable) @gitArguments
$invocationSucceeded = $?
$exitCode = $LASTEXITCODE
if ($null -eq $exitCode) { $exitCode = if ($invocationSucceeded) { 0 } else { 1 } }
exit [int]$exitCode
'@
    $encodedWrapper = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($wrapper))
    $hostExecutable = (Get-Process -Id $PID).Path
    $startInfo = [Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $hostExecutable
    $startInfo.Arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand $encodedWrapper"
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.EnvironmentVariables['S_INIT_GIT_PAYLOAD'] = $payload
    $startInfo.EnvironmentVariables['GIT_TERMINAL_PROMPT'] = '0'
    $startInfo.EnvironmentVariables['GIT_SSH_COMMAND'] = 'ssh -o BatchMode=yes -o ConnectTimeout=15'

    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    $started = $false
    try {
        if (-not $process.Start()) {
            return [pscustomobject]@{
                ExitCode = 127
                Lines = @('failed to start the Git clone process')
                TimedOut = $false
                CleanupSucceeded = $true
            }
        }
        $started = $true
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        $exited = $process.WaitForExit($TimeoutSeconds * 1000)
        $cleanupSucceeded = $true
        if (-not $exited) {
            $cleanupSucceeded = Stop-OwnedProcessTree $process.Id
            try { $process.WaitForExit(5000) | Out-Null } catch { }
        }
        $stdout = try {
            if ($stdoutTask.Wait(2000)) { $stdoutTask.GetAwaiter().GetResult() } else { '' }
        } catch { '' }
        $stderr = try {
            if ($stderrTask.Wait(2000)) { $stderrTask.GetAwaiter().GetResult() } else { '' }
        } catch { '' }
        $lines = @((($stdout + [Environment]::NewLine + $stderr) -split '\r?\n') |
            Where-Object { Has-Text $_ })
        return [pscustomobject]@{
            ExitCode = if ($exited) { $process.ExitCode } else { 124 }
            Lines = $lines
            TimedOut = -not $exited
            CleanupSucceeded = $cleanupSucceeded
        }
    } catch {
        if ($started) {
            try {
                if (-not $process.HasExited) { Stop-OwnedProcessTree $process.Id | Out-Null }
            } catch {
            }
        }
        return [pscustomobject]@{
            ExitCode = 127
            Lines = @($_.Exception.Message)
            TimedOut = $false
            CleanupSucceeded = $true
        }
    } finally {
        $process.Dispose()
    }
}

function Get-LastTextLine($Result) {
    return [string](@($Result.Lines | Where-Object { Has-Text $_ }) | Select-Object -Last 1)
}

function Get-OriginIdentity([string]$Origin) {
    $value = $Origin.Trim()
    $patterns = @(
        '^(?i)git@github\.com:(?<path>[^?#]+?)(?:\.git)?/?$',
        '^(?i)ssh://git@github\.com/(?<path>[^?#]+?)(?:\.git)?/?$',
        '^(?i)https?://(?:[^/@]+@)?github\.com/(?<path>[^?#]+?)(?:\.git)?/?$'
    )
    foreach ($pattern in $patterns) {
        $match = [regex]::Match($value, $pattern)
        if ($match.Success) {
            $path = $match.Groups['path'].Value.TrimEnd('/')
            if ($path.EndsWith('.git', [StringComparison]::OrdinalIgnoreCase)) {
                $path = $path.Substring(0, $path.Length - 4)
            }
            return $path.ToLowerInvariant()
        }
    }
    return $null
}

function Get-RunnerState([string]$RunnerPath, [string]$ExpectedIdentity, [string]$ExpectedRemote, [string]$Source) {
    function Stop-StateFailure([string]$Status, [string]$Message, $GitResult = $null) {
        $detail = if ($null -ne $GitResult) { '; Git: ' + (Get-GitFailureSummary $GitResult) } else { '' }
        if ($Source -eq 'clone') {
            Stop-Runner 'SERVER_CLONE_PARTIAL' ("clone completed but post-clone validation failed: $Message; destination was preserved$detail") 3
        }
        Stop-Runner $Status ($Message + $detail)
    }

    if (Test-Path -LiteralPath $RunnerPath -PathType Leaf) {
        Stop-StateFailure 'SERVER_PATH_COLLISION' 'runner destination exists as a file'
    }
    if (-not (Test-Path -LiteralPath $RunnerPath -PathType Container)) {
        Stop-StateFailure 'SERVER_PATH_COLLISION' 'runner destination is not an accessible directory'
    }
    if (Test-ReparsePoint $RunnerPath) {
        Stop-StateFailure 'SERVER_PATH_COLLISION' 'runner destination cannot be a reparse point'
    }

    $topResult = Invoke-Git @('-C', $RunnerPath, 'rev-parse', '--show-toplevel')
    if ($topResult.ExitCode -ne 0) {
        Stop-StateFailure 'SERVER_REPO_TOPLEVEL_MISMATCH' 'runner destination is not an independent Git working tree' $topResult
    }
    $topLevel = Get-CanonicalPath (Get-LastTextLine $topResult)
    if (-not (Test-PathEqual $topLevel (Get-CanonicalPath $RunnerPath))) {
        Stop-StateFailure 'SERVER_REPO_TOPLEVEL_MISMATCH' 'Git top level does not equal the runner destination'
    }

    $originResult = Invoke-Git @('-C', $RunnerPath, 'remote', 'get-url', 'origin')
    if ($originResult.ExitCode -ne 0) {
        Stop-StateFailure 'SERVER_REPO_ORIGIN_MISMATCH' 'runner repository has no readable origin remote' $originResult
    }
    $originIdentity = Get-OriginIdentity (Get-LastTextLine $originResult)
    if (-not (Has-Text $originIdentity) -or
        -not $originIdentity.Equals($ExpectedIdentity, [StringComparison]::OrdinalIgnoreCase)) {
        Stop-StateFailure 'SERVER_REPO_ORIGIN_MISMATCH' 'runner origin does not identify the expected jp-sunshine repository'
    }

    $statusResult = Invoke-Git @('-C', $RunnerPath, 'status', '--porcelain=v1', '--untracked-files=all')
    if ($statusResult.ExitCode -ne 0) {
        Stop-StateFailure 'SERVER_REPO_TOPLEVEL_MISMATCH' 'runner Git status could not be inspected' $statusResult
    }
    $dirtyLines = @($statusResult.Lines | Where-Object { Has-Text $_ })
    $isDirty = $dirtyLines.Count -gt 0
    $status = if ($Source -eq 'clone') {
        'SERVER_CLONE_OK'
    } elseif ($isDirty) {
        'SERVER_REPO_READY_DIRTY'
    } else {
        'SERVER_REPO_READY'
    }

    [pscustomobject]@{
        schemaVersion = 1
        status = $status
        repoState = if ($Source -eq 'clone') { 'CLONED' } elseif ($isDirty) { 'EXISTING_DIRTY' } else { 'EXISTING' }
        runnerPath = Get-CanonicalPath $RunnerPath
        expectedRemote = $ExpectedRemote
        originIdentity = $originIdentity
        dirty = $isDirty
        mutatedExistingRepository = $false
    } | ConvertTo-Json -Depth 4
    exit 0
}

$canonicalRepoRoot = Get-CanonicalPath $repoRoot
$canonicalGamesRoot = Get-CanonicalPath $gamesRoot
$canonicalProject = Get-CanonicalPath $ProjectPath
if (-not (Has-Text $canonicalProject) -or
    -not (Test-Path -LiteralPath $canonicalProject -PathType Container)) {
    Stop-Runner 'INVALID_PROJECT' 'target project must be an existing directory'
}
if (-not (Test-PathEqual (Get-CanonicalPath (Split-Path -Parent $canonicalProject)) $canonicalGamesRoot)) {
    Stop-Runner 'INVALID_PROJECT' 'target project must be a direct child of the repository games directory'
}
$unsafeProjectPath = Get-ReparsePointOnPath $canonicalGamesRoot $canonicalProject
if (Has-Text $unsafeProjectPath) {
    Stop-Runner 'INVALID_PROJECT' "target project cannot traverse a reparse point: $unsafeProjectPath"
}
$projectName = Split-Path -Leaf $canonicalProject
if ($projectName -notmatch '^slot-fe-(?<slug>[A-Za-z0-9][A-Za-z0-9_-]*)$') {
    Stop-Runner 'INVALID_PROJECT' 'target project name must match slot-fe-{replicationId}'
}
$replicationId = $Matches.slug

$defaultCloneTimeoutSeconds = 180
$gitOverrideRequested = -not $GitExecutable.Equals('git', [StringComparison]::OrdinalIgnoreCase)
$timeoutOverrideRequested = $CloneTimeoutSeconds -ne $defaultCloneTimeoutSeconds
if ($gitOverrideRequested -or $timeoutOverrideRequested) {
    $testMode = [Environment]::GetEnvironmentVariable('S_INIT_TEST_MODE', 'Process')
    if ($testMode -cne '1' -or $projectName -notmatch '^slot-fe-sinittest[0-9a-f]{32}$') {
        Stop-Runner 'INVALID_TEST_HOOK' 'Git and timeout overrides are available only for strict s_init test fixtures'
    }
    if ($gitOverrideRequested) {
        $canonicalShim = Get-CanonicalPath $GitExecutable
        $docRoot = Get-CanonicalPath (Join-Path $canonicalProject 'doc')
        $docPrefix = "$docRoot$([IO.Path]::DirectorySeparatorChar)"
        if (-not (Has-Text $canonicalShim) -or
            -not (Test-Path -LiteralPath $canonicalShim -PathType Leaf) -or
            -not $canonicalShim.StartsWith($docPrefix, [StringComparison]::OrdinalIgnoreCase) -or
            (Has-Text (Get-ReparsePointOnPath $canonicalProject $canonicalShim))) {
            Stop-Runner 'INVALID_TEST_HOOK' 'test Git shim must be a non-reparse ordinary file below the test project doc directory'
        }
        $GitExecutable = $canonicalShim
    }
} else {
    try {
        $gitCommand = Get-Command git -CommandType Application -ErrorAction Stop | Select-Object -First 1
        $GitExecutable = [string]$gitCommand.Source
    } catch {
        Stop-Runner 'GIT_NOT_AVAILABLE' 'git executable could not be resolved'
    }
}

$repoTopResult = Invoke-Git @('-C', $canonicalRepoRoot, 'rev-parse', '--show-toplevel')
if ($repoTopResult.ExitCode -ne 0 -or
    -not (Test-PathEqual (Get-CanonicalPath (Get-LastTextLine $repoTopResult)) $canonicalRepoRoot)) {
    Stop-Runner 'INVALID_REPOSITORY_TOPOLOGY' 'slot-fe-client root is not its own Git top level'
}

$projectInfoPath = Join-Path $canonicalProject 'doc\project_info.md'
if (-not (Test-Path -LiteralPath $projectInfoPath -PathType Leaf)) {
    Stop-Runner 'NEEDS_PROJECT_INFO_INPUT' 'doc/project_info.md is required before resolving the runner'
}
$unsafeProjectInfoPath = Get-ReparsePointOnPath $canonicalProject $projectInfoPath
if (Has-Text $unsafeProjectInfoPath) {
    Stop-Runner 'INVALID_PROJECT_INFO' "project_info path cannot traverse a reparse point: $unsafeProjectInfoPath"
}
$projectInfo = Get-Content -LiteralPath $projectInfoPath -Raw -Encoding UTF8
$gameMatches = [regex]::Matches($projectInfo, '(?m)^\s*-\s*gameId:\s*(?<value>[^\r\n]+?)\s*$')
$urlMatches = [regex]::Matches($projectInfo, '(?m)^\s*-\s*competitorUrl:\s*(?<value>[^\r\n]+?)\s*$')
if ($gameMatches.Count -ne 1 -or $urlMatches.Count -ne 1) {
    Stop-Runner 'INVALID_PROJECT_INFO' 'project_info.md must contain exactly one gameId and competitorUrl field'
}
$metadataGameId = Get-MarkdownScalar $gameMatches[0].Groups['value'].Value
if ($metadataGameId -notmatch '^[A-Za-z0-9][A-Za-z0-9_-]*$') {
    Stop-Runner 'INVALID_PROJECT_INFO' 'gameId may contain only letters, digits, underscores, and hyphens'
}
$competitorUrl = Get-MarkdownScalar $urlMatches[0].Groups['value'].Value
$parsedCompetitorUrl = $null
if ($competitorUrl -match '[\r\n]' -or
    -not [Uri]::TryCreate($competitorUrl, [UriKind]::Absolute, [ref]$parsedCompetitorUrl) -or
    @('http', 'https') -notcontains $parsedCompetitorUrl.Scheme -or
    -not (Has-Text $parsedCompetitorUrl.Host)) {
    Stop-Runner 'INVALID_PROJECT_INFO' 'competitorUrl must be an absolute HTTP(S) URL'
}

$serverRoot = Get-CanonicalPath (Join-Path $gamesRoot 'Server')
if (-not (Test-Path -LiteralPath $serverRoot -PathType Container)) {
    Stop-Runner 'NEEDS_SERVER_ROOT' "expected Server root does not exist: $serverRoot"
}
if (Test-ReparsePoint $serverRoot) {
    Stop-Runner 'NEEDS_SERVER_ROOT' 'Server root cannot be a reparse point'
}

$runnerPath = Get-CanonicalPath (Join-Path $serverRoot "slot-be-runner-$replicationId")
if (-not (Test-PathEqual (Get-CanonicalPath (Split-Path -Parent $runnerPath)) $serverRoot)) {
    Stop-Runner 'SERVER_PATH_COLLISION' 'runner destination escaped the Server root'
}
$expectedRemote = "git@github.com:jp-sunshine/slot-be-runner-$replicationId.git"
$expectedIdentity = "jp-sunshine/slot-be-runner-$replicationId".ToLowerInvariant()

if (Test-Path -LiteralPath $runnerPath) {
    Get-RunnerState $runnerPath $expectedIdentity $expectedRemote 'existing'
}

if ($DryRun) {
    [pscustomobject]@{
        schemaVersion = 1
        status = 'SERVER_CLONE_REQUIRED'
        repoState = 'MISSING'
        runnerPath = $runnerPath
        expectedRemote = $expectedRemote
        command = @('git', 'clone', '--', $expectedRemote, $runnerPath)
        mutated = $false
    } | ConvertTo-Json -Depth 4
    exit 0
}

# Check again immediately before clone so a concurrently-created destination is never overwritten.
if (Test-Path -LiteralPath $runnerPath) {
    Stop-Runner 'SERVER_PATH_COLLISION' 'runner destination appeared before clone; no write was attempted'
}

$cloneResult = Invoke-GitClone @('clone', '--', $expectedRemote, $runnerPath) $CloneTimeoutSeconds
if ($cloneResult.ExitCode -ne 0) {
    $summary = Get-GitFailureSummary $cloneResult
    $timeoutText = if ($cloneResult.TimedOut) {
        if ($cloneResult.CleanupSucceeded) {
            "SSH clone timed out after $CloneTimeoutSeconds seconds and its owned process tree was terminated"
        } else {
            "SSH clone timed out after $CloneTimeoutSeconds seconds and process cleanup could not be fully verified"
        }
    } else {
        'SSH clone failed'
    }
    if (Test-Path -LiteralPath $runnerPath) {
        Stop-Runner 'SERVER_CLONE_PARTIAL' "$timeoutText and left a destination path; it was preserved for manual inspection; Git: $summary" 3
    }
    Stop-Runner 'SERVER_CLONE_FAILED' "$timeoutText without creating the destination; no HTTPS fallback was attempted; Git: $summary" 3
}
if (-not (Test-Path -LiteralPath $runnerPath -PathType Container)) {
    Stop-Runner 'SERVER_CLONE_PARTIAL' 'git reported success but post-clone destination validation failed; any destination was preserved' 3
}

try {
    Get-RunnerState $runnerPath $expectedIdentity $expectedRemote 'clone'
} catch {
    $summary = Protect-SensitiveText $_.Exception.Message
    Stop-Runner 'SERVER_CLONE_PARTIAL' "clone completed but post-clone validation could not be completed; destination was preserved; detail: $summary" 3
}
