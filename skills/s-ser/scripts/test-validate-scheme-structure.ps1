$ErrorActionPreference = 'Stop'
$trialLabel = -join @([char]0x8BD5, [char]0x73A9, [char]0x7248)
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$validator = Join-Path $scriptRoot 'validate-scheme-structure.ps1'
$hostExecutable = (Get-Process -Id $PID).Path
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('s-ser-scheme-test-' + [guid]::NewGuid().ToString('N'))
$serverRoot = Join-Path $testRoot 'Server'
$runnerPath = Join-Path $serverRoot 'slot-be-runner-abc'
$schemeRepository = Join-Path $serverRoot 'slot-rtp-scheme'
$trialRoot = Join-Path $schemeRepository ($trialLabel + 'json')
$remotePath = Join-Path $testRoot 'slot-rtp-scheme-remote.git'
$seedRepository = Join-Path $testRoot 'slot-rtp-scheme-seed'
$seedTrialRoot = Join-Path $seedRepository ($trialLabel + 'json')
$schemePath = Join-Path $runnerPath 'scheme.json'
$referenceName = 'ABC_Test_' + $trialLabel + '.json'
$seedReferencePath = Join-Path $seedTrialRoot $referenceName

function Invoke-GitOrThrow([string[]]$Arguments, [string]$FailureMessage) {
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = @(& git @Arguments 2>&1)
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    if ($exitCode -ne 0) {
        throw "$FailureMessage. Output: $(($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine)"
    }
}

function Invoke-Validator {
    $output = @(& $hostExecutable -NoProfile -ExecutionPolicy Bypass -File $validator -RunnerPath $runnerPath 2>&1)
    $exitCode = $LASTEXITCODE
    $text = ($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    $json = $null
    try { $json = $text | ConvertFrom-Json } catch { }
    return [pscustomobject]@{ ExitCode = $exitCode; Text = $text; Json = $json }
}

function Assert-Result($Result, [int]$ExitCode, [string]$Status, [string]$Name) {
    if ($Result.ExitCode -ne $ExitCode -or $null -eq $Result.Json -or $Result.Json.status -ne $Status) {
        throw "$Name failed. Expected exit $ExitCode and status $Status. Output: $($Result.Text)"
    }
}

try {
    [void](New-Item -ItemType Directory -Force $runnerPath, $seedTrialRoot)
    Invoke-GitOrThrow @('init', '--bare', '--', $remotePath) 'failed to initialize bare scheme remote'
    Invoke-GitOrThrow @('init', '--', $seedRepository) 'failed to initialize scheme seed repository'
    [IO.File]::WriteAllText($seedReferencePath, '{"id":1,"config":{"0":{"id":0,"weight":10}},"flags":[true,"x",1]}')
    Invoke-GitOrThrow @('-C', $seedRepository, 'add', '--', '.') 'failed to stage initial scheme reference fixture'
    Invoke-GitOrThrow @('-C', $seedRepository, '-c', 'user.name=CodexTest', '-c', 'user.email=codex-test@example.invalid', 'commit', '-m', 'initial reference') 'failed to commit initial scheme reference fixture'
    Invoke-GitOrThrow @('-C', $seedRepository, 'branch', '-M', 'main') 'failed to name fixture branch'
    Invoke-GitOrThrow @('-C', $seedRepository, 'remote', 'add', 'origin', $remotePath) 'failed to add fixture remote'
    Invoke-GitOrThrow @('-C', $seedRepository, 'push', '-u', 'origin', 'main') 'failed to push initial reference fixture'
    Invoke-GitOrThrow @('--git-dir', $remotePath, 'symbolic-ref', 'HEAD', 'refs/heads/main') 'failed to set fixture remote HEAD'
    Invoke-GitOrThrow @('clone', '--', $remotePath, $schemeRepository) 'failed to clone scheme reference fixture'

    [IO.File]::WriteAllText($schemePath, '{"flags":[false,"y",2],"config":{"0":{"weight":999,"id":8}},"id":2}')
    [IO.File]::WriteAllText($seedReferencePath, '{"id":9,"config":{"0":{"id":7,"weight":20}},"flags":[false,"z",3]}')
    Invoke-GitOrThrow @('-C', $seedRepository, 'add', '--', '.') 'failed to stage remote reference update'
    Invoke-GitOrThrow @('-C', $seedRepository, '-c', 'user.name=CodexTest', '-c', 'user.email=codex-test@example.invalid', 'commit', '-m', 'update reference') 'failed to commit remote reference update'
    Invoke-GitOrThrow @('-C', $seedRepository, 'push', 'origin', 'main') 'failed to push remote reference update'

    $valid = Invoke-Validator
    Assert-Result $valid 0 'VALID' 'matching structure'
    if ($valid.Json.referencePulled -ne $true -or $valid.Json.referenceCommitBeforeSync -eq $valid.Json.referenceCommit) {
        throw "matching structure did not pull the remote update. Output: $($valid.Text)"
    }
    if ($valid.Json.validationMode -ne 'STRUCTURE_COMPARISON' -or
        $valid.Json.runnerSchemePresent -ne $true -or
        $valid.Json.structureCompared -ne $true) {
        throw "matching structure did not report comparison mode. Output: $($valid.Text)"
    }

    Remove-Item -LiteralPath $schemePath -Force
    $referenceFallback = Invoke-Validator
    Assert-Result $referenceFallback 0 'VALID' 'missing local scheme reference fallback'
    if ($referenceFallback.Json.validationMode -ne 'REFERENCE_FALLBACK' -or
        $referenceFallback.Json.runnerSchemePresent -ne $false -or
        $referenceFallback.Json.structureCompared -ne $false -or
        $referenceFallback.Json.schemeSource -ne 'slot-rtp-scheme' -or
        $referenceFallback.Json.effectiveSchemePath -ne $referenceFallback.Json.referencePath) {
        throw "missing local scheme did not use the reference fallback. Output: $($referenceFallback.Text)"
    }
    if (Test-Path -LiteralPath $schemePath) {
        throw 'reference fallback unexpectedly created runner scheme.json'
    }
    [IO.File]::WriteAllText($schemePath, '{"flags":[false,"y",2],"config":{"0":{"weight":999,"id":8}},"id":2}')

    [IO.File]::WriteAllText($schemePath, '{"id":2,"config":{"0":{"id":8}},"flags":[false,"y",2]}')
    $mismatch = Invoke-Validator
    Assert-Result $mismatch 1 'SCHEME_STRUCTURE_MISMATCH' 'missing nested property'

    [IO.File]::WriteAllText((Join-Path $seedTrialRoot ('ABC_Other_' + $trialLabel + '.json')), '{"id":1}')
    Invoke-GitOrThrow @('-C', $seedRepository, 'add', '--', '.') 'failed to stage ambiguous reference fixture'
    Invoke-GitOrThrow @('-C', $seedRepository, '-c', 'user.name=CodexTest', '-c', 'user.email=codex-test@example.invalid', 'commit', '-m', 'add ambiguous reference') 'failed to commit ambiguous reference fixture'
    Invoke-GitOrThrow @('-C', $seedRepository, 'push', 'origin', 'main') 'failed to push ambiguous reference fixture'
    $ambiguous = Invoke-Validator
    Assert-Result $ambiguous 1 'NEEDS_SCHEME_REFERENCE' 'ambiguous reference'

    Remove-Item -LiteralPath $seedReferencePath, (Join-Path $seedTrialRoot ('ABC_Other_' + $trialLabel + '.json')) -Force
    Invoke-GitOrThrow @('-C', $seedRepository, 'add', '--', '.') 'failed to stage missing reference fixture'
    Invoke-GitOrThrow @('-C', $seedRepository, '-c', 'user.name=CodexTest', '-c', 'user.email=codex-test@example.invalid', 'commit', '-m', 'remove references') 'failed to commit missing reference fixture'
    Invoke-GitOrThrow @('-C', $seedRepository, 'push', 'origin', 'main') 'failed to push missing reference fixture'
    $missingReference = Invoke-Validator
    Assert-Result $missingReference 1 'NEEDS_SCHEME_REFERENCE_DECISION' 'missing reference after pull'

    [IO.File]::WriteAllText((Join-Path $schemeRepository 'local-edit.txt'), 'must block sync')
    $dirtyReferenceRepository = Invoke-Validator
    Assert-Result $dirtyReferenceRepository 1 'NEEDS_SCHEME_SYNC_DECISION' 'dirty reference repository'
    Remove-Item -LiteralPath (Join-Path $schemeRepository 'local-edit.txt') -Force

    [IO.File]::WriteAllText((Join-Path $schemeRepository 'local-commit.txt'), 'must not be rebased or reset')
    Invoke-GitOrThrow @('-C', $schemeRepository, 'add', '--', 'local-commit.txt') 'failed to stage local-ahead fixture'
    Invoke-GitOrThrow @('-C', $schemeRepository, '-c', 'user.name=CodexTest', '-c', 'user.email=codex-test@example.invalid', 'commit', '-m', 'local reference edit') 'failed to commit local-ahead fixture'
    $locallyAheadReferenceRepository = Invoke-Validator
    Assert-Result $locallyAheadReferenceRepository 1 'NEEDS_SCHEME_SYNC_DECISION' 'locally ahead reference repository'

} finally {
    if (Test-Path -LiteralPath $testRoot) {
        Remove-Item -LiteralPath $testRoot -Recurse -Force
    }
}

Write-Output 'PASS: s_ser scheme structure validator'
