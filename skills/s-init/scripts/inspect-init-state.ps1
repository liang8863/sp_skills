[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath
)

$ErrorActionPreference = 'Stop'
$skillRoot = Split-Path -Parent $PSScriptRoot
$skillsRoot = Split-Path -Parent $skillRoot
$codexRoot = Split-Path -Parent $skillsRoot
$repoRoot = Split-Path -Parent $codexRoot
$gamesRoot = Join-Path $repoRoot 'games'
$serverRoot = Join-Path $gamesRoot 'Server'

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

function Test-PathWithin([string]$Root, [string]$Candidate) {
    $rootPath = Get-CanonicalPath $Root
    $candidatePath = Get-CanonicalPath $Candidate
    if (-not (Has-Text $rootPath) -or -not (Has-Text $candidatePath)) { return $false }
    if (Test-PathEqual $rootPath $candidatePath) { return $true }
    $prefix = "$rootPath$([IO.Path]::DirectorySeparatorChar)"
    return $candidatePath.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)
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

function Stop-Inventory([string]$Status, [string]$Message) {
    [pscustomobject]@{
        schemaVersion = 1
        overallStatus = $Status
        message = $Message
    } | ConvertTo-Json -Compress
    exit 1
}

function Test-GameId([string]$Value) {
    return (Has-Text $Value) -and $Value -match '^[A-Za-z0-9][A-Za-z0-9_-]*$'
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

function Normalize-MarkdownTableCell([string]$Value) {
    $withoutCodeTicks = $Value.Replace([string][char]96, '')
    return [regex]::Replace($withoutCodeTicks.Trim(), '\s+', ' ')
}

function Get-VisibleMarkdownDocument([string]$Content) {
    $visibleLines = [System.Collections.Generic.List[string]]::new()
    $inHtmlComment = $false
    $fenceCharacter = [char]0
    $fenceLength = 0
    $rawHtmlTag = $null

    foreach ($sourceLine in @($Content -split '\r?\n')) {
        if ($fenceLength -gt 0) {
            $closingMatch = [regex]::Match($sourceLine, '^\s{0,3}(?<marker>`{3,}|~{3,})\s*$')
            if ($closingMatch.Success) {
                $marker = $closingMatch.Groups['marker'].Value
                if ($marker[0] -eq $fenceCharacter -and $marker.Length -ge $fenceLength) {
                    $fenceCharacter = [char]0
                    $fenceLength = 0
                }
            }
            $visibleLines.Add('')
            continue
        }

        if (Has-Text $rawHtmlTag) {
            if ($sourceLine -match ('(?i)</\s*{0}\s*>' -f [regex]::Escape($rawHtmlTag))) {
                $rawHtmlTag = $null
            }
            $visibleLines.Add('')
            continue
        }

        $remaining = [string]$sourceLine
        $builder = [Text.StringBuilder]::new()
        while ($remaining.Length -gt 0) {
            if ($inHtmlComment) {
                $commentEnd = $remaining.IndexOf('-->', [StringComparison]::Ordinal)
                if ($commentEnd -lt 0) {
                    $remaining = ''
                    break
                }
                $remaining = $remaining.Substring($commentEnd + 3)
                $inHtmlComment = $false
                continue
            }

            $commentStart = $remaining.IndexOf('<!--', [StringComparison]::Ordinal)
            if ($commentStart -lt 0) {
                [void]$builder.Append($remaining)
                $remaining = ''
                break
            }
            [void]$builder.Append($remaining.Substring(0, $commentStart))
            $remaining = $remaining.Substring($commentStart + 4)
            $inHtmlComment = $true
        }

        $visibleLine = $builder.ToString()
        if (-not $inHtmlComment) {
            $rawHtmlMatch = [regex]::Match(
                $visibleLine,
                '(?i)^\s{0,3}<(?<tag>script|template|pre|style)(?:\s|>|/)'
            )
            if ($rawHtmlMatch.Success) {
                $openingTag = $rawHtmlMatch.Groups['tag'].Value
                if ($visibleLine -notmatch ('(?i)</\s*{0}\s*>' -f [regex]::Escape($openingTag))) {
                    $rawHtmlTag = $openingTag
                }
                $visibleLines.Add('')
                continue
            }
            $openingMatch = [regex]::Match($visibleLine, '^\s{0,3}(?<marker>`{3,}|~{3,})(?<info>.*)$')
            if ($openingMatch.Success) {
                $marker = $openingMatch.Groups['marker'].Value
                $fenceCharacter = $marker[0]
                $fenceLength = $marker.Length
                $visibleLines.Add('')
                continue
            }
        }
        $visibleLines.Add($visibleLine)
    }

    return [pscustomobject]@{ lines = [string[]]$visibleLines }
}

function Test-SectionHasNonUnknownProse([string[]]$Lines) {
    foreach ($line in $Lines) {
        $text = $line.Trim()
        if (-not (Has-Text $text) -or $text.StartsWith('|') -or $text.StartsWith('#')) { continue }
        $text = [regex]::Replace($text, '^\s*(?:[-*+]\s+|\d+[.)]\s+)', '')
        $text = Get-MarkdownScalar $text
        $labelMatch = [regex]::Match($text, '^[^:]{1,80}:\s*(?<value>.*)$')
        if ($labelMatch.Success) {
            $text = $labelMatch.Groups['value'].Value
        }
        $withoutUnknown = [regex]::Replace($text, '(?i)\bUNKNOWN\b', '')
        if ($withoutUnknown -match '[\p{L}\p{Nd}]') { return $true }
    }
    return $false
}

function Test-IsExplicitUnknown([string]$Value) {
    return (Has-Text $Value) -and $Value.Trim().Equals('UNKNOWN', [StringComparison]::OrdinalIgnoreCase)
}

function Test-SafeProjectDocumentRoot([string]$Value) {
    if (-not (Has-Text $Value)) { return $false }
    $path = Normalize-PlanRelativePath $Value
    if (-not $path.Equals('doc', [StringComparison]::Ordinal) -and
        -not $path.StartsWith('doc/', [StringComparison]::Ordinal)) {
        return $false
    }
    if ($path -match '[<>:"|?*#\x00-\x1F]') { return $false }
    foreach ($segment in @($path -split '/')) {
        if (-not (Has-Text $segment) -or @('.', '..') -contains $segment) { return $false }
    }
    return $true
}

function Resolve-EvidenceReferenceCell([string]$Value, $EvidenceRegistry) {
    if (Test-IsExplicitUnknown $Value) {
        return [pscustomobject]@{
            valid = $true
            explicitUnknown = $true
            ids = @()
            missing = @()
            hasBehaviorEvidence = $false
        }
    }

    $ids = @($Value -split '[,;]' | ForEach-Object { $_.Trim() })
    $missing = [System.Collections.Generic.List[string]]::new()
    $valid = $ids.Count -gt 0 -and @($ids | Where-Object {
        -not (Has-Text $_) -or $_.Equals('UNKNOWN', [StringComparison]::OrdinalIgnoreCase)
    }).Count -eq 0
    $hasBehaviorEvidence = $false
    foreach ($id in $ids) {
        if (-not (Has-Text $id) -or $id.Equals('UNKNOWN', [StringComparison]::OrdinalIgnoreCase)) { continue }
        if (-not $EvidenceRegistry.ContainsKey($id)) {
            $missing.Add($id)
            $valid = $false
            continue
        }
        if (@('legacy-script', 'local-resource', 'competitor-runtime') -contains $EvidenceRegistry[$id]) {
            $hasBehaviorEvidence = $true
        }
    }

    return [pscustomobject]@{
        valid = $valid
        explicitUnknown = $false
        ids = $ids
        missing = @($missing)
        hasBehaviorEvidence = $hasBehaviorEvidence
    }
}

function Split-MarkdownTableRow([string]$Line) {
    $trimmed = $Line.Trim()
    if (-not $trimmed.StartsWith('|') -or -not $trimmed.EndsWith('|')) {
        return @()
    }

    $inner = $trimmed.Substring(1, $trimmed.Length - 2)
    return @([regex]::Split($inner, '(?<!\\)\|') | ForEach-Object {
        Normalize-MarkdownTableCell $_
    })
}

function Test-MarkdownTableHeaders([string[]]$Actual, [string[]]$Expected) {
    if ($Actual.Count -ne $Expected.Count) { return $false }
    for ($index = 0; $index -lt $Expected.Count; $index++) {
        $expectedCell = Normalize-MarkdownTableCell $Expected[$index]
        if (-not $Actual[$index].Equals($expectedCell, [StringComparison]::OrdinalIgnoreCase)) {
            return $false
        }
    }
    return $true
}

function Test-MarkdownTableSeparator([string[]]$Cells, [int]$ExpectedCount) {
    if ($Cells.Count -ne $ExpectedCount) { return $false }
    foreach ($cell in $Cells) {
        if ($cell -notmatch '^:?-{3,}:?$') { return $false }
    }
    return $true
}

function Get-RequiredMarkdownTable([string[]]$Lines, [string[]]$Headers) {
    for ($lineIndex = 0; $lineIndex -lt $Lines.Count; $lineIndex++) {
        $cells = @(Split-MarkdownTableRow $Lines[$lineIndex])
        if (-not (Test-MarkdownTableHeaders $cells $Headers)) { continue }

        if ($lineIndex + 1 -ge $Lines.Count) {
            return [pscustomobject]@{ found = $true; validSeparator = $false; validRows = $false; hasData = $false; rows = @() }
        }
        $separatorCells = @(Split-MarkdownTableRow $Lines[$lineIndex + 1])
        if (-not (Test-MarkdownTableSeparator $separatorCells $Headers.Count)) {
            return [pscustomobject]@{ found = $true; validSeparator = $false; validRows = $false; hasData = $false; rows = @() }
        }

        $dataRows = [System.Collections.Generic.List[object]]::new()
        $validRows = $true
        for ($dataIndex = $lineIndex + 2; $dataIndex -lt $Lines.Count; $dataIndex++) {
            $trimmedDataLine = $Lines[$dataIndex].Trim()
            if (-not $trimmedDataLine.StartsWith('|')) { break }
            $dataCells = @(Split-MarkdownTableRow $Lines[$dataIndex])
            if ($dataCells.Count -ne $Headers.Count -or
                @($dataCells | Where-Object { -not (Has-Text $_) }).Count -gt 0) {
                $validRows = $false
                continue
            }
            if ((Test-MarkdownTableHeaders $dataCells $Headers) -or
                (Test-MarkdownTableSeparator $dataCells $Headers.Count)) {
                $validRows = $false
                continue
            }
            $dataRows.Add([pscustomobject]@{ cells = [string[]]$dataCells })
        }
        return [pscustomobject]@{
            found = $true
            validSeparator = $true
            validRows = $validRows
            hasData = $dataRows.Count -gt 0
            rows = @($dataRows)
        }
    }

    return [pscustomobject]@{ found = $false; validSeparator = $false; validRows = $false; hasData = $false; rows = @() }
}

function Get-IdentityMetadataMatches([string[]]$Lines, [string]$Name) {
    $matches = [System.Collections.Generic.List[string]]::new()
    $pattern = '^\s*-\s*{0}\s*:\s*(?<value>.+?)\s*$' -f [regex]::Escape($Name)
    foreach ($line in $Lines) {
        $match = [regex]::Match($line, $pattern)
        if ($match.Success) {
            $matches.Add((Get-MarkdownScalar $match.Groups['value'].Value))
        }
    }
    return @($matches)
}

function Normalize-PlanRelativePath([string]$Value) {
    return $Value.Replace('\\', '/').Trim().TrimEnd('/')
}

function Test-SafeEvidenceSource([string]$Value) {
    if (-not (Has-Text $Value)) { return $false }
    $source = $Value.Trim()
    if ($source -match '^[A-Za-z][A-Za-z0-9+.-]*://' -or
        $source -match '^[A-Za-z]:' -or
        $source.StartsWith('\\') -or
        $source.StartsWith('//') -or
        $source.StartsWith('/')) {
        return $false
    }

    $pathPart = ($source -split '#', 2)[0].Replace('\\', '/')
    if (-not (Has-Text $pathPart) -or $pathPart.Contains('?')) { return $false }
    $segments = @($pathPart -split '/')
    if (@($segments | Where-Object { $_ -eq '..' }).Count -gt 0) { return $false }
    if ($pathPart -match '(?i)(^|/)(CC3Proj|UIProj|resource[-_]project)(/|$)' -or
        $pathPart -match '(?i)(^|/)[^/]+_UI(/|$)') {
        return $false
    }
    return $true
}

function Get-EvidenceSourcePath([string]$Value) {
    return Normalize-PlanRelativePath (($Value.Trim() -split '#', 2)[0])
}

function Get-RedactedUrl([Uri]$Uri) {
    $authority = $Uri.Host
    if (-not $Uri.IsDefaultPort) { $authority = "$authority`:$($Uri.Port)" }
    return '{0}://{1}{2}' -f $Uri.Scheme, $authority, $Uri.AbsolutePath
}

function Test-FileHasNonWhitespace([string]$Path) {
    $reader = [IO.File]::OpenText($Path)
    try {
        while ($reader.Peek() -ge 0) {
            if (-not [char]::IsWhiteSpace([char]$reader.Read())) { return $true }
        }
        return $false
    } finally {
        $reader.Dispose()
    }
}

function Get-JavaScriptInventory([string]$Root) {
    $nonEmptyCount = 0
    $emptyCount = 0
    $pending = [System.Collections.Generic.Stack[string]]::new()
    $pending.Push($Root)

    while ($pending.Count -gt 0) {
        $directory = $pending.Pop()
        foreach ($item in (Get-ChildItem -LiteralPath $directory -Force)) {
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                Stop-Inventory 'INVALID_LOCAL_REFERENCE' "doc/js_scripts cannot contain a reparse point: $($item.FullName)"
            }
            if ($item.PSIsContainer) {
                $pending.Push($item.FullName)
            } elseif ($item.Extension.Equals('.js', [StringComparison]::OrdinalIgnoreCase)) {
                if (Test-FileHasNonWhitespace $item.FullName) { $nonEmptyCount++ } else { $emptyCount++ }
            }
        }
    }

    return [pscustomobject]@{
        nonEmptyCount = $nonEmptyCount
        emptyCount = $emptyCount
    }
}

function Get-ResourceInventory([string]$Root) {
    $fileCount = 0
    $pending = [System.Collections.Generic.Stack[string]]::new()
    $pending.Push($Root)

    while ($pending.Count -gt 0) {
        $directory = $pending.Pop()
        foreach ($item in (Get-ChildItem -LiteralPath $directory -Force)) {
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                Stop-Inventory 'INVALID_LOCAL_REFERENCE' "resource root cannot contain a reparse point: $($item.FullName)"
            }
            if ($item.PSIsContainer) {
                $pending.Push($item.FullName)
            } else {
                $fileCount++
            }
        }
    }

    return [pscustomobject]@{ fileCount = $fileCount }
}

function Get-ProjectPlanInventory(
    [string]$Path,
    [string]$ReplicationId,
    [string]$MetadataGameId,
    [string]$RedactedCompetitorUrl,
    [string]$CanonicalProject,
    [string]$CanonicalRunner,
    [string]$ScriptsStatus,
    [string]$ResourceStatus
) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return [pscustomobject]@{ status = 'MISSING'; issues = @() }
    }

    $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    $issues = [System.Collections.Generic.List[string]]::new()
    if ([string]::IsNullOrWhiteSpace($content)) {
        $issues.Add('project_plan.md is blank')
        return [pscustomobject]@{ status = 'NEEDS_REVIEW'; issues = @($issues) }
    }

    $requiredSections = @(
        '1. Identity and status',
        '2. Scope and non-goals',
        '3. Evidence registry',
        '4. Capability matrix',
        '5. Source-to-target mapping',
        '6. Protocol and fixtures',
        '7. Client workstream',
        '8. Server workstream',
        '9. Dependency sequence',
        '10. Acceptance matrix',
        '11. Unknowns and Gates',
        '12. Task handoff',
        '13. Definition of done'
    )

    $visibleDocument = Get-VisibleMarkdownDocument $content
    $lines = @($visibleDocument.lines)
    $headings = [System.Collections.Generic.List[object]]::new()
    for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
        $headingMatch = [regex]::Match($lines[$lineIndex], '^##\s+(?<title>.+?)\s*$')
        if ($headingMatch.Success) {
            $headings.Add([pscustomobject]@{
                title = $headingMatch.Groups['title'].Value.Trim()
                lineIndex = $lineIndex
            })
        }
    }

    $sectionOrderValid = $headings.Count -eq $requiredSections.Count
    if ($sectionOrderValid) {
        for ($sectionIndex = 0; $sectionIndex -lt $requiredSections.Count; $sectionIndex++) {
            if (-not $headings[$sectionIndex].title.Equals(
                $requiredSections[$sectionIndex],
                [StringComparison]::Ordinal
            )) {
                $sectionOrderValid = $false
                break
            }
        }
    }
    if (-not $sectionOrderValid) {
        $issues.Add('expected exactly the 13 required H2 sections in contract order')
    }

    $sectionLines = @{}
    foreach ($section in $requiredSections) {
        $records = @($headings | Where-Object { $_.title -ceq $section })
        if ($records.Count -ne 1) {
            $issues.Add("expected exactly one required section: $section")
            continue
        }
        $record = $records[0]
        $nextHeading = @($headings | Where-Object { $_.lineIndex -gt $record.lineIndex } |
            Sort-Object lineIndex |
            Select-Object -First 1)
        $endIndex = if ($nextHeading.Count -eq 1) { $nextHeading[0].lineIndex } else { $lines.Count }
        $body = [System.Collections.Generic.List[string]]::new()
        for ($bodyIndex = $record.lineIndex + 1; $bodyIndex -lt $endIndex; $bodyIndex++) {
            $body.Add($lines[$bodyIndex])
        }
        $sectionLines[$section] = @($body)
    }

    foreach ($section in @(
        '2. Scope and non-goals',
        '9. Dependency sequence',
        '13. Definition of done'
    )) {
        if ($sectionLines.ContainsKey($section) -and
            -not (Test-SectionHasNonUnknownProse ([string[]]$sectionLines[$section]))) {
            $issues.Add("required section must contain non-UNKNOWN prose: $section")
        }
    }

    $identityValues = @{}
    if ($sectionLines.ContainsKey('1. Identity and status')) {
        $identityLines = [string[]]$sectionLines['1. Identity and status']
        $requiredIdentityFields = @(
            'schemaVersion',
            'replicationId',
            'metadataGameId',
            'targetClient',
            'targetServer',
            'projectInfo',
            'scriptsRoot',
            'resourceRoot',
            'competitorUrl',
            'serverState',
            'planState',
            'generatedAt',
            'clientGitBaseline',
            'serverGitBaseline'
        )
        foreach ($field in $requiredIdentityFields) {
            $fieldMatches = @(Get-IdentityMetadataMatches $identityLines $field)
            if ($fieldMatches.Count -ne 1 -or -not (Has-Text $fieldMatches[0])) {
                $issues.Add("expected exactly one non-empty Identity metadata field: $field")
            } else {
                $identityValues[$field] = $fieldMatches[0]
            }
        }

        if ($identityValues.ContainsKey('schemaVersion') -and $identityValues.schemaVersion -ne '1') {
            $issues.Add('Identity schemaVersion must be 1')
        }
        if ($identityValues.ContainsKey('replicationId') -and
            -not $identityValues.replicationId.Equals($ReplicationId, [StringComparison]::Ordinal)) {
            $issues.Add('Identity replicationId must match the target project slug with ordinal-exact casing')
        }
        if ($identityValues.ContainsKey('metadataGameId') -and
            -not $identityValues.metadataGameId.Equals($MetadataGameId, [StringComparison]::OrdinalIgnoreCase)) {
            $issues.Add('Identity metadataGameId must match doc/project_info.md')
        }
        $expectedIdentityPaths = @{
            projectInfo = 'doc/project_info.md'
            scriptsRoot = 'doc/js_scripts'
            resourceRoot = "assets/resources/$($ReplicationId)_res"
        }
        foreach ($field in $expectedIdentityPaths.Keys) {
            if ($identityValues.ContainsKey($field) -and
                (Normalize-PlanRelativePath $identityValues[$field]) -cne $expectedIdentityPaths[$field]) {
                $issues.Add("Identity $field must be $($expectedIdentityPaths[$field])")
            }
        }
        $expectedTargetPaths = @{
            targetClient = $CanonicalProject
            targetServer = $CanonicalRunner
        }
        foreach ($field in $expectedTargetPaths.Keys) {
            if (-not $identityValues.ContainsKey($field)) { continue }
            $identityPath = Get-CanonicalPath $identityValues[$field]
            if (-not (Has-Text $identityPath) -or
                -not (Test-PathEqual $identityPath $expectedTargetPaths[$field])) {
                $issues.Add("Identity $field must match the derived canonical path: $($expectedTargetPaths[$field])")
            }
        }
        if ($identityValues.ContainsKey('competitorUrl')) {
            $competitorValue = $identityValues.competitorUrl
            $parsedCompetitor = $null
            if ($competitorValue.Equals('UNKNOWN', [StringComparison]::OrdinalIgnoreCase) -or
                -not [Uri]::TryCreate($competitorValue, [UriKind]::Absolute, [ref]$parsedCompetitor) -or
                @('http', 'https') -notcontains $parsedCompetitor.Scheme -or
                -not (Has-Text $parsedCompetitor.Host) -or
                (Has-Text $parsedCompetitor.Query) -or
                (Has-Text $parsedCompetitor.UserInfo) -or
                (Has-Text $parsedCompetitor.Fragment) -or
                -not (Has-Text $RedactedCompetitorUrl) -or
                -not $competitorValue.Equals($RedactedCompetitorUrl, [StringComparison]::Ordinal)) {
                $issues.Add('Identity competitorUrl must exactly match the inventory redacted HTTP(S) origin/path without userinfo, query, or fragment')
            }
        }
        if ($identityValues.ContainsKey('serverState') -and
            $identityValues.serverState -notmatch '^(EXISTING|EXISTING_DIRTY|CLONED|UNKNOWN|NEEDS_[A-Z0-9_]+|SERVER_[A-Z0-9_]+)$') {
            $issues.Add('Identity serverState must be an allowed state, Gate, or UNKNOWN')
        }
        if ($identityValues.ContainsKey('planState') -and
            @('DRAFT_EVIDENCE_GATED', 'READY_FOR_HANDOFF', 'BLOCKED') -notcontains $identityValues.planState) {
            $issues.Add('Identity planState must be DRAFT_EVIDENCE_GATED, READY_FOR_HANDOFF, or BLOCKED')
        }
        if ($identityValues.ContainsKey('generatedAt') -and
            -not $identityValues.generatedAt.Equals('UNKNOWN', [StringComparison]::OrdinalIgnoreCase)) {
            $generatedAt = [DateTimeOffset]::MinValue
            if (-not [DateTimeOffset]::TryParse($identityValues.generatedAt, [ref]$generatedAt)) {
                $issues.Add('Identity generatedAt must be a timestamp or UNKNOWN')
            }
        }
    }

    $tableContracts = @(
        [pscustomobject]@{
            section = '3. Evidence registry'
            name = 'Evidence registry'
            headers = @('Evidence ID', 'Class', 'Relative source/artifact', 'Observation', 'Supports', 'Confidence', 'Limits')
        },
        [pscustomobject]@{
            section = '4. Capability matrix'
            name = 'Capability matrix'
            headers = @('Module', 'Capability', 'Observed behavior or UNKNOWN', 'Evidence IDs', 'Client gap', 'Server gap', 'Route (s_cli/s_ser/both/blocked)')
        },
        [pscustomobject]@{
            section = '5. Source-to-target mapping'
            name = 'Source-to-target mapping'
            headers = @('Map ID', 'Capability', 'Source behavior', 'Evidence IDs', 'Target client owner/candidate path', 'Target server producer/contract', 'Adaptation', 'Dependency/Gate', 'Status')
        },
        [pscustomobject]@{
            section = '6. Protocol and fixtures'
            name = 'Protocol'
            headers = @('Flow/semantic field', 'Request/response shape, unit, null/omitted semantics', 'Client consumer and lifetime', 'Server producer', 'Evidence IDs', 'Raw/fixture artifact', 'Status')
        },
        [pscustomobject]@{
            section = '6. Protocol and fixtures'
            name = 'Fixtures'
            headers = @('Fixture ID', 'Scenario', 'Seed and provenance', 'Request', 'Expected frames/layout/state/amount', 'Raw response path', 'Runner test', 'Simulator/client replay', 'Status')
        },
        [pscustomobject]@{
            section = '7. Client workstream'
            name = 'Client workstream'
            headers = @('Task ID', 'Scope', 'Prerequisites', 'Candidate target areas', 'Evidence IDs', 'Verification', 'Acceptance', 'Status')
        },
        [pscustomobject]@{
            section = '7. Client workstream'
            name = 'Reel module choreography'
            headers = @('Module', 'State / trigger / data boundary', 'Candidate target owner / binding', 'Resource Prefab replacement decision', 'New Prefab property / transform decision', 'VFX / effect', 'Animation / timing', 'Audio', 'Completion callback / cleanup', 'Evidence IDs', 'Fixture / acceptance', 'Status')
        },
        [pscustomobject]@{
            section = '8. Server workstream'
            name = 'Server workstream'
            headers = @('Task ID', 'Scope (contract/rules/seeds/math/runtime)', 'Prerequisites', 'Candidate server area', 'Fixture output', 'Tests/simulator', 'Acceptance', 'Status')
        },
        [pscustomobject]@{
            section = '10. Acceptance matrix'
            name = 'Acceptance matrix'
            headers = @('Acceptance ID', 'Layer', 'Scenario/fixture', 'Expected observable', 'Method/artifact', 'Status')
        },
        [pscustomobject]@{
            section = '11. Unknowns and Gates'
            name = 'Unknowns and Gates'
            headers = @('Gate', 'Missing or contradictory evidence', 'Blocks', 'Allowed work', 'Exit criteria', 'Owner')
        },
        [pscustomobject]@{
            section = '12. Task handoff'
            name = 'Task handoff'
            headers = @('Order', 'Task ID', 'Skill', 'Code repo/write scope', 'Document root', 'Evidence/fixtures', 'Depends on', 'Ready when', 'Deliverable', 'Status')
        }
    )
    $resolvedTables = @{}
    foreach ($tableContract in $tableContracts) {
        if (-not $sectionLines.ContainsKey($tableContract.section)) { continue }
        $table = Get-RequiredMarkdownTable ([string[]]$sectionLines[$tableContract.section]) $tableContract.headers
        $resolvedTables[$tableContract.name] = $table
        if (-not $table.found) {
            $issues.Add("missing required $($tableContract.name) table header")
        } elseif (-not $table.validSeparator) {
            $issues.Add("required $($tableContract.name) table has an invalid separator row")
        } elseif (-not $table.validRows) {
            $issues.Add("required $($tableContract.name) table contains a malformed row or an empty cell")
        } elseif (-not $table.hasData) {
            $issues.Add("required $($tableContract.name) table must contain at least one data row")
        }
    }

    $evidenceClasses = [System.Collections.Generic.List[string]]::new()
    $evidenceRegistry = [System.Collections.Generic.Dictionary[string,string]]::new(
        [StringComparer]::OrdinalIgnoreCase
    )
    if ($resolvedTables.ContainsKey('Evidence registry')) {
        $evidenceTable = $resolvedTables['Evidence registry']
        foreach ($row in @($evidenceTable.rows)) {
            $cells = [string[]]$row.cells
            if ($cells.Count -lt 3) { continue }
            $evidenceId = $cells[0].Trim()
            $evidenceClass = $cells[1].Trim().ToLowerInvariant()
            $source = $cells[2].Trim()
            $evidenceClasses.Add($evidenceClass)

            if (-not (Has-Text $evidenceId)) {
                $issues.Add('Evidence Registry IDs must not be empty')
            } elseif ($evidenceRegistry.ContainsKey($evidenceId)) {
                $issues.Add("Evidence Registry contains a duplicate Evidence ID: $evidenceId")
            } else {
                $evidenceRegistry.Add($evidenceId, $evidenceClass)
            }

            if (@('legacy-script', 'local-resource', 'competitor-runtime', 'project-info', 'quick-reference') -notcontains $evidenceClass) {
                $issues.Add("Evidence Registry $evidenceId uses an unsupported class: $($cells[1])")
            }
            if (-not (Test-SafeEvidenceSource $source)) {
                $issues.Add("Evidence Registry $evidenceId source must be a safe local path without external-project locators: $source")
                continue
            }

            $sourcePath = Get-EvidenceSourcePath $source
            $expectedRoot = $null
            $reparseCheckRoot = $CanonicalProject
            $candidatePath = $null
            $pathBoundaryValid = $false
            switch ($evidenceClass) {
                'legacy-script' {
                    $expectedRoot = Join-Path $CanonicalProject 'doc\js_scripts'
                    $pathBoundaryValid = $sourcePath.StartsWith('doc/js_scripts/', [StringComparison]::OrdinalIgnoreCase)
                    $candidatePath = Join-Path $CanonicalProject ($sourcePath.Replace('/', '\'))
                    if (-not [IO.Path]::GetExtension($sourcePath).Equals('.js', [StringComparison]::OrdinalIgnoreCase)) {
                        $issues.Add("Evidence Registry $evidenceId legacy-script source must be a .js file: $source")
                    }
                }
                'local-resource' {
                    $relativeResourceRoot = "assets/resources/$($ReplicationId)_res/"
                    $expectedRoot = Join-Path $CanonicalProject "assets\resources\$($ReplicationId)_res"
                    $pathBoundaryValid = $sourcePath.StartsWith($relativeResourceRoot, [StringComparison]::OrdinalIgnoreCase)
                    $candidatePath = Join-Path $CanonicalProject ($sourcePath.Replace('/', '\'))
                }
                'competitor-runtime' {
                    $expectedRoot = Join-Path $CanonicalProject 'doc\s_init\evidence'
                    $pathBoundaryValid = $sourcePath.StartsWith('doc/s_init/evidence/', [StringComparison]::OrdinalIgnoreCase)
                    $candidatePath = Join-Path $CanonicalProject ($sourcePath.Replace('/', '\'))
                }
                'project-info' {
                    $expectedRoot = Join-Path $CanonicalProject 'doc'
                    $pathBoundaryValid = $sourcePath.Equals('doc/project_info.md', [StringComparison]::OrdinalIgnoreCase)
                    $candidatePath = Join-Path $CanonicalProject 'doc\project_info.md'
                }
                'quick-reference' {
                    $expectedRoot = Join-Path $repoRoot '.codex\agents\s-cli-agent\references'
                    $reparseCheckRoot = $repoRoot
                    $pathBoundaryValid = $sourcePath.Equals(
                        '.codex/agents/s-cli-agent/references/slot-function-reference.md',
                        [StringComparison]::OrdinalIgnoreCase
                    )
                    $candidatePath = Join-Path $repoRoot ($sourcePath.Replace('/', '\'))
                }
            }

            if (-not $pathBoundaryValid -or
                -not (Has-Text $candidatePath) -or
                -not (Test-PathWithin $expectedRoot $candidatePath)) {
                $issues.Add("Evidence Registry $evidenceId source is outside the fixed $evidenceClass evidence path: $source")
                continue
            }
            if (-not (Test-Path -LiteralPath $candidatePath -PathType Leaf)) {
                $issues.Add("Evidence Registry $evidenceId source does not resolve to a local file: $source")
                continue
            }
            if ($evidenceClass -eq 'legacy-script' -and
                [IO.Path]::GetExtension($sourcePath).Equals('.js', [StringComparison]::OrdinalIgnoreCase) -and
                -not (Test-FileHasNonWhitespace $candidatePath)) {
                $issues.Add("Evidence Registry $evidenceId legacy-script source must contain non-whitespace JavaScript: $source")
            }
            $unsafeEvidencePath = Get-ReparsePointOnPath $reparseCheckRoot $candidatePath
            if (Has-Text $unsafeEvidencePath) {
                $issues.Add("Evidence Registry $evidenceId source cannot traverse a reparse point: $source")
            }
        }
    }

    foreach ($requiredEvidenceClass in @('project-info', 'quick-reference')) {
        if (@($evidenceClasses | Where-Object { $_ -eq $requiredEvidenceClass }).Count -eq 0) {
            $issues.Add("Evidence Registry must include at least one $requiredEvidenceClass row")
        }
    }
    if ($ScriptsStatus -eq 'READY' -and
        @($evidenceClasses | Where-Object { $_ -eq 'legacy-script' }).Count -eq 0) {
        $issues.Add('ready doc/js_scripts requires at least one legacy-script Evidence Registry row')
    }

    $requiredCapabilityModules = @(
        'Bootstrap / Loading',
        'Bridge / host communication',
        'Control / spin modes',
        'GameService lifecycle',
        'API / mapper / response contract',
        'Event / state lifecycle',
        'Reel core / stop / mask / layout',
        'Reel background',
        'Drop peeking',
        'Spin peeking',
        'Reel elimination',
        'Performance orchestration',
        'InfoBoard / status',
        'Win / payout presentation',
        'Big Win / Total Win',
        'Free Game / Bonus',
        'game-specific mechanics',
        'Resource / Prefab / audio / animation'
    )
    $requiredCapabilitySet = [System.Collections.Generic.HashSet[string]]::new(
        [string[]]$requiredCapabilityModules,
        [StringComparer]::Ordinal
    )
    $seenCapabilitySet = [System.Collections.Generic.HashSet[string]]::new(
        [StringComparer]::Ordinal
    )
    if ($resolvedTables.ContainsKey('Capability matrix')) {
        foreach ($row in @($resolvedTables['Capability matrix'].rows)) {
            $cells = [string[]]$row.cells
            if ($cells.Count -eq 0) { continue }
            $module = $cells[0].Trim()
            if ($requiredCapabilitySet.Contains($module)) {
                [void]$seenCapabilitySet.Add($module)
            } elseif ($module -notmatch '(?i)^game-specific(?:\s+mechanics?)?\s*[:/-]\s*\S.*$') {
                $issues.Add("Capability matrix uses a module outside the 18 canonical modules: $module")
            }
            if ($cells.Count -gt 6 -and
                @('s_cli', 's_ser', 'both', 'blocked') -cnotcontains $cells[6].Trim()) {
                $issues.Add("Capability matrix route must be s_cli, s_ser, both, or blocked: $($cells[6])")
            }
        }
    }
    foreach ($module in $requiredCapabilityModules) {
        if (-not $seenCapabilitySet.Contains($module)) {
            $issues.Add("Capability matrix must include the canonical module: $module")
        }
    }

    $requiredReelModules = @(
        'Reel core',
        'Reel background',
        'Drop peeking',
        'Spin peeking',
        'Elimination'
    )
    $requiredReelModuleSet = [System.Collections.Generic.HashSet[string]]::new(
        [string[]]$requiredReelModules,
        [StringComparer]::Ordinal
    )
    $seenReelModuleSet = [System.Collections.Generic.HashSet[string]]::new(
        [StringComparer]::Ordinal
    )
    if ($resolvedTables.ContainsKey('Reel module choreography')) {
        foreach ($row in @($resolvedTables['Reel module choreography'].rows)) {
            $cells = [string[]]$row.cells
            if ($cells.Count -eq 0) { continue }
            $module = $cells[0].Trim()
            if ($requiredReelModuleSet.Contains($module)) {
                [void]$seenReelModuleSet.Add($module)
            } else {
                $issues.Add("Reel module choreography uses an unsupported module: $module")
            }
            if ($cells.Count -gt 11 -and
                $cells[11].Trim().Equals('READY', [StringComparison]::OrdinalIgnoreCase)) {
                $prefabDecision = $cells[3].Trim()
                $resourcePrefabPrefix = "assets/resources/$($ReplicationId)_res/"
                if (Test-IsExplicitUnknown $prefabDecision) {
                    $issues.Add("READY Reel module choreography row '$module' requires a Resource Prefab replacement decision")
                } elseif (-not $prefabDecision.StartsWith($resourcePrefabPrefix, [StringComparison]::OrdinalIgnoreCase) -and
                    $prefabDecision -notmatch '(?i)^(RETAIN_LEGACY|NO_RESOURCE_PREFAB)\s*:\s*\S') {
                    $issues.Add("READY Reel module choreography row '$module' must use a target resource Prefab or state RETAIN_LEGACY/NO_RESOURCE_PREFAB with a reason")
                }

                $propertyDecision = $cells[4].Trim()
                if (Test-IsExplicitUnknown $propertyDecision) {
                    $issues.Add("READY Reel module choreography row '$module' requires a New Prefab property / transform decision")
                } elseif ($propertyDecision -notmatch '(?i)^(KEEP_RESOURCE_SERIALIZED|ADJUST_FOR_COMPETITOR)\s*:\s*\S') {
                    $issues.Add("READY Reel module choreography row '$module' must keep resource serialized properties or record a competitor-evidence adjustment")
                } elseif ($propertyDecision -match '(?i)(OLD[_\s-]*PREFAB|LEGACY[_\s-]*PREFAB|COPY[_\s-]*(OLD|LEGACY))') {
                    $issues.Add("READY Reel module choreography row '$module' cannot copy a legacy Prefab property into a new resource Prefab")
                }
            }
        }
    }
    foreach ($module in $requiredReelModules) {
        if (-not $seenReelModuleSet.Contains($module)) {
            $issues.Add("Reel module choreography must include the module: $module")
        }
    }

    $evidenceReferenceContracts = @(
        [pscustomobject]@{ name = 'Capability matrix'; rowIdIndex = 0; evidenceIndex = 3; behaviorIndex = 2 },
        [pscustomobject]@{ name = 'Source-to-target mapping'; rowIdIndex = 0; evidenceIndex = 3; behaviorIndex = 2 },
        [pscustomobject]@{ name = 'Protocol'; rowIdIndex = 0; evidenceIndex = 4; behaviorIndex = 1 },
        [pscustomobject]@{ name = 'Client workstream'; rowIdIndex = 0; evidenceIndex = 4; behaviorIndex = -1 },
        [pscustomobject]@{ name = 'Reel module choreography'; rowIdIndex = 0; evidenceIndex = 9; behaviorIndex = 1 }
    )
    foreach ($referenceContract in $evidenceReferenceContracts) {
        if (-not $resolvedTables.ContainsKey($referenceContract.name)) { continue }
        foreach ($row in @($resolvedTables[$referenceContract.name].rows)) {
            $cells = [string[]]$row.cells
            if ($cells.Count -le $referenceContract.evidenceIndex) { continue }
            $rowId = $cells[$referenceContract.rowIdIndex]
            $resolution = Resolve-EvidenceReferenceCell $cells[$referenceContract.evidenceIndex] $evidenceRegistry
            if (-not $resolution.valid) {
                $missingText = if ($resolution.missing.Count -gt 0) {
                    ': ' + ($resolution.missing -join ', ')
                } else {
                    ''
                }
                $issues.Add("$($referenceContract.name) row '$rowId' must reference registered Evidence IDs or explicit UNKNOWN$missingText")
            }
            if ($referenceContract.behaviorIndex -ge 0 -and
                $cells.Count -gt $referenceContract.behaviorIndex -and
                -not (Test-IsExplicitUnknown $cells[$referenceContract.behaviorIndex]) -and
                -not $resolution.hasBehaviorEvidence) {
                $issues.Add("$($referenceContract.name) row '$rowId' has non-UNKNOWN competitor behavior without legacy-script, local-resource, or competitor-runtime evidence")
            }
        }
    }

    if ($resolvedTables.ContainsKey('Task handoff')) {
        foreach ($row in @($resolvedTables['Task handoff'].rows)) {
            $cells = [string[]]$row.cells
            if ($cells.Count -gt 2 -and @('s_cli', 's_ser') -cnotcontains $cells[2].Trim()) {
                $issues.Add("Task handoff Skill must be s_cli or s_ser: $($cells[2])")
            }
            if ($cells.Count -gt 4 -and -not (Test-SafeProjectDocumentRoot $cells[4])) {
                $issues.Add("Task handoff Document root must be safe project-relative doc or doc/**: $($cells[4])")
            }
        }
    }

    $gateNames = [System.Collections.Generic.HashSet[string]]::new(
        [StringComparer]::OrdinalIgnoreCase
    )
    if ($resolvedTables.ContainsKey('Unknowns and Gates')) {
        foreach ($row in @($resolvedTables['Unknowns and Gates'].rows)) {
            $cells = [string[]]$row.cells
            if ($cells.Count -gt 0 -and (Has-Text $cells[0])) {
                [void]$gateNames.Add($cells[0].Trim())
            }
        }
    }

    if (@($evidenceClasses | Where-Object { $_ -eq 'competitor-runtime' }).Count -eq 0 -and
        -not $gateNames.Contains('NEEDS_RUNTIME_EVIDENCE')) {
        $issues.Add('missing competitor-runtime evidence requires NEEDS_RUNTIME_EVIDENCE in Unknowns and Gates')
    }

    if (@('MISSING', 'EMPTY') -contains $ResourceStatus) {
        if (-not $identityValues.ContainsKey('planState') -or
            @('DRAFT_EVIDENCE_GATED', 'BLOCKED') -notcontains $identityValues.planState) {
            $issues.Add('a missing or empty local resource requires planState DRAFT_EVIDENCE_GATED or BLOCKED')
        }
        if (@($evidenceClasses | Where-Object { $_ -eq 'local-resource' }).Count -gt 0) {
            $issues.Add('a missing or empty local resource cannot be declared as local-resource evidence')
        }

        if (-not $gateNames.Contains('NEEDS_LOCAL_REFERENCE')) {
            $issues.Add('a missing or empty local resource requires NEEDS_LOCAL_REFERENCE in Unknowns and Gates')
        }
    } elseif ($ResourceStatus -eq 'READY' -and
        @($evidenceClasses | Where-Object { $_ -eq 'local-resource' }).Count -eq 0) {
        $issues.Add('a ready local resource requires at least one local-resource Evidence Registry row')
    }

    if ($identityValues.ContainsKey('planState') -and
        $identityValues.planState.Equals('READY_FOR_HANDOFF', [StringComparison]::Ordinal)) {
        if ($ScriptsStatus -ne 'READY') {
            $issues.Add('READY_FOR_HANDOFF requires doc/js_scripts status READY')
        }
        foreach ($baselineField in @('clientGitBaseline', 'serverGitBaseline')) {
            if (-not $identityValues.ContainsKey($baselineField) -or
                $identityValues[$baselineField] -match '(?i)(^|[^A-Z0-9])UNKNOWN([^A-Z0-9]|$)') {
                $issues.Add("READY_FOR_HANDOFF requires a concrete Identity $baselineField")
            }
        }

        if ($resolvedTables.ContainsKey('Unknowns and Gates')) {
            foreach ($row in @($resolvedTables['Unknowns and Gates'].rows)) {
                $cells = [string[]]$row.cells
                if ($cells.Count -gt 0 -and $cells[0].Trim() -match '(?i)^NEEDS_') {
                    $issues.Add("READY_FOR_HANDOFF cannot contain an unresolved Gate: $($cells[0])")
                }
            }
        }

        foreach ($statusContract in @(
            [pscustomobject]@{ name = 'Client workstream'; statusIndex = 7 },
            [pscustomobject]@{ name = 'Reel module choreography'; statusIndex = 11 },
            [pscustomobject]@{ name = 'Server workstream'; statusIndex = 7 },
            [pscustomobject]@{ name = 'Task handoff'; statusIndex = 9 }
        )) {
            if (-not $resolvedTables.ContainsKey($statusContract.name)) { continue }
            foreach ($row in @($resolvedTables[$statusContract.name].rows)) {
                $cells = [string[]]$row.cells
                if ($cells.Count -gt $statusContract.statusIndex -and
                    $cells[$statusContract.statusIndex] -match '(?i)(^|[^A-Z0-9])(UNKNOWN|DRAFT|BLOCKED)([^A-Z0-9]|$)') {
                    $issues.Add("READY_FOR_HANDOFF cannot contain UNKNOWN, DRAFT, or BLOCKED $($statusContract.name) status: $($cells[$statusContract.statusIndex])")
                }
            }
        }
    }

    return [pscustomobject]@{
        status = if ($issues.Count -eq 0) { 'READY' } else { 'NEEDS_REVIEW' }
        issues = @($issues)
    }
}

$canonicalGamesRoot = Get-CanonicalPath $gamesRoot
$canonicalProject = Get-CanonicalPath $ProjectPath
if (-not (Has-Text $canonicalProject) -or
    -not (Test-Path -LiteralPath $canonicalProject -PathType Container)) {
    Stop-Inventory 'INVALID_PROJECT' 'target project must be an existing directory'
}
if (-not (Test-PathEqual (Get-CanonicalPath (Split-Path -Parent $canonicalProject)) $canonicalGamesRoot)) {
    Stop-Inventory 'INVALID_PROJECT' 'target project must be a direct child of the repository games directory'
}
$unsafeProjectPath = Get-ReparsePointOnPath $canonicalGamesRoot $canonicalProject
if (Has-Text $unsafeProjectPath) {
    Stop-Inventory 'INVALID_PROJECT' "target project cannot traverse a reparse point: $unsafeProjectPath"
}
$projectName = Split-Path -Leaf $canonicalProject
if ($projectName -notmatch '^slot-fe-(?<slug>[A-Za-z0-9][A-Za-z0-9_-]*)$') {
    Stop-Inventory 'INVALID_PROJECT' 'target project name must match slot-fe-{replicationId}'
}
$replicationId = $Matches.slug
$canonicalRunner = Get-CanonicalPath (Join-Path $serverRoot "slot-be-runner-$replicationId")

$docPath = Join-Path $canonicalProject 'doc'
$projectInfoPath = Join-Path $docPath 'project_info.md'
$scriptsPath = Join-Path $docPath 'js_scripts'
$projectPlanPath = Join-Path $docPath 'project_plan.md'

if (Test-Path -LiteralPath $docPath -PathType Leaf) {
    Stop-Inventory 'INVALID_PROJECT' 'doc path must be a directory'
}
foreach ($candidate in @($docPath, $projectInfoPath, $scriptsPath, $projectPlanPath)) {
    $unsafePath = Get-ReparsePointOnPath $canonicalProject $candidate
    if (Has-Text $unsafePath) {
        Stop-Inventory 'INVALID_PROJECT' "init input cannot traverse a reparse point: $unsafePath"
    }
}

$metadataGameId = $null
$projectInfoStatus = 'MISSING'
$competitorUrlStatus = 'MISSING'
$redactedCompetitorUrl = $null

if (Test-Path -LiteralPath $projectInfoPath -PathType Container) {
    Stop-Inventory 'INVALID_PROJECT_INFO' 'doc/project_info.md must be a file'
}
if (Test-Path -LiteralPath $projectInfoPath -PathType Leaf) {
    $projectInfoStatus = 'READY'
    $content = Get-Content -LiteralPath $projectInfoPath -Raw -Encoding UTF8
    $gameMatches = [regex]::Matches($content, '(?m)^\s*-\s*gameId:\s*(?<value>[^\r\n]+?)\s*$')
    $urlMatches = [regex]::Matches($content, '(?m)^\s*-\s*competitorUrl:\s*(?<value>[^\r\n]+?)\s*$')
    if ($gameMatches.Count -ne 1 -or $urlMatches.Count -ne 1) {
        Stop-Inventory 'INVALID_PROJECT_INFO' 'project_info.md must contain exactly one gameId and competitorUrl field'
    }

    $metadataGameId = Get-MarkdownScalar $gameMatches[0].Groups['value'].Value
    if (-not (Test-GameId $metadataGameId)) {
        Stop-Inventory 'INVALID_PROJECT_INFO' 'gameId may contain only letters, digits, underscores, and hyphens'
    }

    $urlText = Get-MarkdownScalar $urlMatches[0].Groups['value'].Value
    $parsedUrl = $null
    if ($urlText -match '[\r\n]' -or
        -not [Uri]::TryCreate($urlText, [UriKind]::Absolute, [ref]$parsedUrl) -or
        @('http', 'https') -notcontains $parsedUrl.Scheme -or
        -not (Has-Text $parsedUrl.Host)) {
        Stop-Inventory 'INVALID_PROJECT_INFO' 'competitorUrl must be an absolute HTTP(S) URL'
    }
    $competitorUrlStatus = 'READY'
    $redactedCompetitorUrl = Get-RedactedUrl $parsedUrl
}

$scriptsStatus = 'MISSING'
$scriptInventory = [pscustomobject]@{ nonEmptyCount = 0; emptyCount = 0 }
if (Test-Path -LiteralPath $scriptsPath -PathType Leaf) {
    Stop-Inventory 'INVALID_LOCAL_REFERENCE' 'doc/js_scripts must be a directory'
}
if (Test-Path -LiteralPath $scriptsPath -PathType Container) {
    $scriptInventory = Get-JavaScriptInventory $scriptsPath
    $scriptsStatus = if ($scriptInventory.nonEmptyCount -gt 0) { 'READY' } else { 'EMPTY' }
}

$resourcePath = Join-Path $canonicalProject "assets\resources\$($replicationId)_res"
$resourceStatus = 'MISSING'
$resourceInventory = [pscustomobject]@{ fileCount = 0 }
$unsafeResourcePath = Get-ReparsePointOnPath $canonicalProject $resourcePath
if (Has-Text $unsafeResourcePath) {
    Stop-Inventory 'INVALID_LOCAL_REFERENCE' "resource root cannot traverse a reparse point: $unsafeResourcePath"
}
if (Test-Path -LiteralPath $resourcePath -PathType Leaf) {
    Stop-Inventory 'INVALID_LOCAL_REFERENCE' "resource root must be a directory: $resourcePath"
}
if (Test-Path -LiteralPath $resourcePath -PathType Container) {
    $resourceInventory = Get-ResourceInventory $resourcePath
    $resourceStatus = if ($resourceInventory.fileCount -gt 0) { 'READY' } else { 'EMPTY' }
}

$projectPlanStatus = 'MISSING'
$projectPlanIssues = @()
if (Test-Path -LiteralPath $projectPlanPath -PathType Container) {
    Stop-Inventory 'INVALID_PROJECT_PLAN' 'doc/project_plan.md must be a file'
}
if (Test-Path -LiteralPath $projectPlanPath -PathType Leaf) {
    $projectPlanInventory = Get-ProjectPlanInventory `
        $projectPlanPath `
        $replicationId `
        $metadataGameId `
        $redactedCompetitorUrl `
        $canonicalProject `
        $canonicalRunner `
        $scriptsStatus `
        $resourceStatus
    $projectPlanStatus = $projectPlanInventory.status
    $projectPlanIssues = @($projectPlanInventory.issues)
}

$nextActions = [System.Collections.Generic.List[string]]::new()
if ($projectInfoStatus -ne 'READY') { $nextActions.Add('CREATE_PROJECT_INFO') }
if ($scriptsStatus -ne 'READY') { $nextActions.Add('IMPORT_JS_SCRIPTS') }
if ($projectPlanStatus -eq 'MISSING') { $nextActions.Add('CREATE_PROJECT_PLAN') }
if ($projectPlanStatus -eq 'NEEDS_REVIEW') { $nextActions.Add('REVIEW_PROJECT_PLAN') }
if ($projectPlanStatus -eq 'READY') { $nextActions.Add('PROJECT_PLAN_EXISTS') }
if ($resourceStatus -ne 'READY') { $nextActions.Add('RECORD_LOCAL_RESOURCE_GATE') }

$overallStatus = 'READY'
if ($projectInfoStatus -ne 'READY') {
    $overallStatus = 'NEEDS_PROJECT_INFO_INPUT'
} elseif ($scriptsStatus -ne 'READY') {
    $overallStatus = 'NEEDS_JS_SCRIPTS'
} elseif ($projectPlanStatus -eq 'MISSING') {
    $overallStatus = 'NEEDS_PROJECT_PLAN_CREATION'
} elseif ($projectPlanStatus -eq 'NEEDS_REVIEW') {
    $overallStatus = 'NEEDS_PROJECT_PLAN_REVIEW'
}

[pscustomobject]@{
    schemaVersion = 1
    overallStatus = $overallStatus
    projectPath = $canonicalProject
    replicationId = $replicationId
    metadataGameId = $metadataGameId
    inputs = [pscustomobject]@{
        projectInfo = [pscustomobject]@{
            path = $projectInfoPath
            status = $projectInfoStatus
            competitorUrlStatus = $competitorUrlStatus
            redactedCompetitorUrl = $redactedCompetitorUrl
        }
        jsScripts = [pscustomobject]@{
            path = $scriptsPath
            status = $scriptsStatus
            nonEmptyJavaScriptFiles = $scriptInventory.nonEmptyCount
            emptyJavaScriptFiles = $scriptInventory.emptyCount
        }
        projectPlan = [pscustomobject]@{
            path = $projectPlanPath
            status = $projectPlanStatus
            validationIssues = $projectPlanIssues
        }
        localResource = [pscustomobject]@{
            path = $resourcePath
            status = $resourceStatus
            ordinaryFiles = $resourceInventory.fileCount
        }
    }
    nextActions = @($nextActions)
} | ConvertTo-Json -Depth 6
