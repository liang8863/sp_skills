[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$skillRoot = Split-Path -Parent $PSScriptRoot
$files = @(
    (Join-Path $skillRoot 'SKILL.md'),
    (Join-Path $skillRoot '..\..\agents\s-init-agent\AGENT.md'),
    (Join-Path $skillRoot 'references\project-plan-contract.md'),
    (Join-Path $skillRoot 'references\detailed-plan-contract.md')
)

$requiredByFile = @{
    (Join-Path $skillRoot 'SKILL.md') = @('{replicationId}_res/loading', 'LoadingPanel', 'Sprite.spriteFrame', '.meta', 'NEEDS_LOCAL_REFERENCE', 'CLIENT_CONTRACT_GAP')
    (Join-Path $skillRoot '..\..\agents\s-init-agent\AGENT.md') = @('{replicationId}_res/loading', 'LoadingPanel', 'Sprite.spriteFrame', '.meta', 'NEEDS_LOCAL_REFERENCE', 'CLIENT_CONTRACT_GAP')
    (Join-Path $skillRoot 'references\project-plan-contract.md') = @('{replicationId}_res/loading', 'LoadingPanel', 'Sprite.spriteFrame', '.meta', 'NEEDS_LOCAL_REFERENCE', 'CLIENT_CONTRACT_GAP')
    (Join-Path $skillRoot 'references\detailed-plan-contract.md') = @('{replicationId}_res/loading', 'LoadingPanel', 'Sprite.spriteFrame')
}

foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        throw "Missing rule file: $file"
    }

    $content = Get-Content -LiteralPath $file -Raw
    foreach ($needle in $requiredByFile[$file]) {
        if (-not $content.Contains($needle)) {
            throw "Rule file '$file' is missing required text: $needle"
        }
    }
}

Write-Output "PASS: LoadingPanel loading-resource binding rule is synchronized across $($files.Count) rule files."
