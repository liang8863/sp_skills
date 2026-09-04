$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillRoot = Split-Path -Parent $scriptRoot
$validator = Join-Path $scriptRoot 'validate-plan.ps1'
$template = Join-Path $skillRoot 'templates\plan.template.json'
$hostExecutable = (Get-Process -Id $PID).Path

& $hostExecutable -NoProfile -ExecutionPolicy Bypass -File $validator -PlanPath $template -SkipPathChecks
if ($LASTEXITCODE -ne 0) { throw 'Valid plan was rejected' }

$invalidPath = Join-Path ([IO.Path]::GetTempPath()) ("s-cli-invalid-{0}.json" -f [guid]::NewGuid())
try {
    $invalid = Get-Content -LiteralPath $template -Raw -Encoding UTF8 | ConvertFrom-Json
    $invalid.analysisRouting.PSObject.Properties.Remove('evidence')
    $invalid | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $invalidPath -Encoding UTF8

    & $hostExecutable -NoProfile -ExecutionPolicy Bypass -File $validator -PlanPath $invalidPath -SkipPathChecks
    if ($LASTEXITCODE -eq 0) { throw 'Invalid plan was accepted' }

    $invalid.rootCause.PSObject.Properties.Remove('evidence')
    $invalid | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $invalidPath -Encoding UTF8

    & $hostExecutable -NoProfile -ExecutionPolicy Bypass -File $validator -PlanPath $invalidPath -SkipPathChecks
    if ($LASTEXITCODE -eq 0) { throw 'Plan without root-cause evidence was accepted' }

    $invalid = Get-Content -LiteralPath $template -Raw -Encoding UTF8 | ConvertFrom-Json
    $invalid.analysisRouting.module = 'Reel / Spin Data Contract'
    $invalid.serverDataCheck.PSObject.Properties.Remove('rawResponse')
    $invalid | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $invalidPath -Encoding UTF8
    & $hostExecutable -NoProfile -ExecutionPolicy Bypass -File $validator -PlanPath $invalidPath -SkipPathChecks
    if ($LASTEXITCODE -eq 0) { throw 'Turntable plan without server raw-response evidence was accepted' }
} finally {
    Remove-Item -LiteralPath $invalidPath -Force -ErrorAction SilentlyContinue
}

Write-Output 'PASS: s_cli plan validator'
