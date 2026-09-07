$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillRoot = Split-Path -Parent $scriptRoot
$skillsRoot = Split-Path -Parent $skillRoot
$codexRoot = Split-Path -Parent $skillsRoot
$repoRoot = Split-Path -Parent $codexRoot
$gamesRoot = Join-Path $repoRoot 'games'
$initializer = Join-Path $scriptRoot 'initialize-project-info.ps1'
$hostExecutable = (Get-Process -Id $PID).Path
$testPrefix = 'slot-fe-sclitest_'
$invalidTestPrefix = '__s_cli_project_info_test_'
$testProjects = [System.Collections.Generic.List[string]]::new()
$outsidePaths = [System.Collections.Generic.List[string]]::new()
$junctionPaths = [System.Collections.Generic.List[string]]::new()

function Get-CanonicalPath([string]$Path) {
    return ([IO.Path]::GetFullPath($Path)).TrimEnd([char[]]@(
        [IO.Path]::DirectorySeparatorChar,
        [IO.Path]::AltDirectorySeparatorChar
    ))
}

function Assert-SafeProject([string]$Path) {
    $canonicalPath = Get-CanonicalPath $Path
    $leaf = Split-Path -Leaf $canonicalPath
    if (-not (Get-CanonicalPath (Split-Path -Parent $canonicalPath)).Equals(
        (Get-CanonicalPath $gamesRoot),
        [StringComparison]::OrdinalIgnoreCase
    ) -or (-not $leaf.StartsWith($testPrefix, [StringComparison]::Ordinal) -and
        -not $leaf.StartsWith($invalidTestPrefix, [StringComparison]::Ordinal))) {
        throw "Unsafe test project path: $canonicalPath"
    }
}

function New-TestProject([string]$Suffix) {
    $name = '{0}{1}_{2}' -f $testPrefix, ([guid]::NewGuid().ToString('N')), $Suffix
    $path = Join-Path $gamesRoot $name
    Assert-SafeProject $path
    [IO.Directory]::CreateDirectory($path) | Out-Null
    $script:testProjects.Add($path)
    return $path
}

function New-NonSlugTestProject([string]$Suffix) {
    $name = '{0}{1}_{2}' -f $invalidTestPrefix, ([guid]::NewGuid().ToString('N')), $Suffix
    $path = Join-Path $gamesRoot $name
    Assert-SafeProject $path
    [IO.Directory]::CreateDirectory($path) | Out-Null
    $script:testProjects.Add($path)
    return $path
}

function Get-ReplicationId([string]$Project) {
    $name = Split-Path -Leaf (Get-CanonicalPath $Project)
    if ($name -notmatch '^slot-fe-(?<replicationId>[A-Za-z0-9][A-Za-z0-9_-]*)$') {
        throw "Test project is not slug-shaped: $Project"
    }
    return [string]$Matches.replicationId
}

function Add-ResourceRoot([string]$Project, [string]$GameId, [switch]$Empty) {
    $path = Join-Path $Project "assets\resources\$($GameId)_res"
    [IO.Directory]::CreateDirectory($path) | Out-Null
    if (-not $Empty) {
        [IO.File]::WriteAllText((Join-Path $path 'resource.dat'), 'resource')
    }
    return $path
}

function Add-SlugResourceRoot([string]$Project, [switch]$Empty) {
    return Add-ResourceRoot $Project (Get-ReplicationId $Project) -Empty:$Empty
}

function Invoke-Initializer(
    [string]$Project,
    [string]$Url = '',
    [string]$ExplicitGameId = '',
    [switch]$AllowMissingResourceForSInit
) {
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $initializer, '-ProjectPath', $Project)
    if (-not [string]::IsNullOrWhiteSpace($Url)) { $arguments += @('-CompetitorUrl', $Url) }
    if (-not [string]::IsNullOrWhiteSpace($ExplicitGameId)) { $arguments += @('-GameId', $ExplicitGameId) }
    if ($AllowMissingResourceForSInit) { $arguments += '-AllowMissingResourceForSInit' }
    $previousErrorAction = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = (& $hostExecutable @arguments 2>&1 | Out-String)
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorAction
    }
    return [pscustomobject]@{ ExitCode = $exitCode; Output = $output }
}

function Assert-Result($Result, [int]$ExitCode, [string]$Pattern, [string]$Name) {
    if ($Result.ExitCode -ne $ExitCode -or $Result.Output -notmatch $Pattern) {
        throw "$Name failed. Expected exit $ExitCode and '$Pattern': $($Result.Output)"
    }
}

function Assert-NoProjectInfo([string]$Project, [string]$Name) {
    if (Test-Path -LiteralPath (Join-Path $Project 'doc\project_info.md')) {
        throw "$Name unexpectedly created doc/project_info.md"
    }
}

$outsideProject = $null
$junctionPath = $null
try {
    $slugProject = New-TestProject 'slug'
    $slug = Get-ReplicationId $slugProject
    Add-SlugResourceRoot $slugProject | Out-Null
    $slugResult = Invoke-Initializer $slugProject 'https://competitor.example/game?id=1'
    Assert-Result $slugResult 0 '^CREATED:' 'slug inference'
    $slugInfo = Get-Content -LiteralPath (Join-Path $slugProject 'doc\project_info.md') -Raw -Encoding UTF8
    foreach ($pattern in @(
        "(?m)^- gameId: $([regex]::Escape($slug))$",
        '(?m)^- competitorUrl: https://competitor\.example/game\?id=1$',
        '(?m)^- projectPath: .+$',
        "(?m)^- targetProject: $([regex]::Escape((Split-Path -Leaf $slugProject)))\r?$"
    )) {
        if ($slugInfo -notmatch $pattern) { throw "canonical file is missing '$pattern': $slugInfo" }
    }
    if ($slugInfo -match '(?i)uiProjectPath|resource-project') {
        throw "canonical file contains a prohibited external-project field: $slugInfo"
    }

    $providerProject = New-TestProject 'provider_metadata'
    $providerReplicationId = Get-ReplicationId $providerProject
    $providerGameId = 'provider_102'
    Add-SlugResourceRoot $providerProject | Out-Null
    $providerResourceRoot = Join-Path $providerProject "assets\resources\$($providerGameId)_res"
    if (Test-Path -LiteralPath $providerResourceRoot) {
        throw 'provider metadata test unexpectedly has a metadataGameId resource root'
    }
    $providerResult = Invoke-Initializer $providerProject 'https://competitor.example/provider' $providerGameId
    Assert-Result $providerResult 0 '^CREATED:' 'replicationId and metadataGameId separation'
    $providerInfo = Get-Content -LiteralPath (Join-Path $providerProject 'doc\project_info.md') -Raw -Encoding UTF8
    if ($providerInfo -notmatch "(?m)^- gameId: $([regex]::Escape($providerGameId))\r?$") {
        throw "provider metadata gameId was not written: $providerInfo"
    }
    if (-not (Test-Path -LiteralPath (Join-Path $providerProject "assets\resources\$($providerReplicationId)_res") -PathType Container)) {
        throw 'replicationId resource root was not used by the successful provider metadata case'
    }

    $metadataOnlyResourceProject = New-TestProject 'metadata_root_only'
    $metadataOnlyReplicationId = Get-ReplicationId $metadataOnlyResourceProject
    $metadataOnlyGameId = 'provider_103'
    Add-ResourceRoot $metadataOnlyResourceProject $metadataOnlyGameId | Out-Null
    $metadataOnlyResult = Invoke-Initializer $metadataOnlyResourceProject 'https://competitor.example/metadata-root' $metadataOnlyGameId
    Assert-Result $metadataOnlyResult 1 '^INVALID_PROJECT_INFO_INPUT: missing corresponding resource root' 'metadataGameId-only resource root'
    $expectedMissingRoot = "assets/resources/$($metadataOnlyReplicationId)_res"
    if ($metadataOnlyResult.Output -notmatch [regex]::Escape($expectedMissingRoot)) {
        throw "metadataGameId-only resource root did not report the missing replicationId root '$expectedMissingRoot': $($metadataOnlyResult.Output)"
    }
    Assert-NoProjectInfo $metadataOnlyResourceProject 'metadataGameId-only resource root'

    $sInitProject = New-TestProject 's_init_missing_resource'
    $sInitGameId = 'provider_104'
    $sInitResult = Invoke-Initializer `
        -Project $sInitProject `
        -Url 'https://competitor.example/s-init' `
        -ExplicitGameId $sInitGameId `
        -AllowMissingResourceForSInit
    Assert-Result $sInitResult 0 '^CREATED:' 's_init missing-resource exception'
    $sInitInfo = Get-Content -LiteralPath (Join-Path $sInitProject 'doc\project_info.md') -Raw -Encoding UTF8
    if ($sInitInfo -notmatch "(?m)^- gameId: $([regex]::Escape($sInitGameId))\r?$") {
        throw "s_init missing-resource exception did not preserve metadata gameId: $sInitInfo"
    }
    if (Test-Path -LiteralPath (Join-Path $sInitProject 'assets\resources')) {
        throw 's_init missing-resource exception unexpectedly created a resource directory'
    }

    $emptyResourceProject = New-TestProject 'empty_resource'
    Add-SlugResourceRoot $emptyResourceProject -Empty | Out-Null
    $emptyResource = Invoke-Initializer $emptyResourceProject 'https://competitor.example/empty-resource'
    Assert-Result $emptyResource 1 '^INVALID_PROJECT_INFO_INPUT: resource root must contain at least one ordinary file' 'empty replicationId resource root'
    Assert-NoProjectInfo $emptyResourceProject 'empty replicationId resource root'

    $sInitEmptyProject = New-TestProject 's_init_empty_resource'
    Add-SlugResourceRoot $sInitEmptyProject -Empty | Out-Null
    $sInitEmpty = Invoke-Initializer `
        -Project $sInitEmptyProject `
        -Url 'https://competitor.example/s-init-empty' `
        -AllowMissingResourceForSInit
    Assert-Result $sInitEmpty 0 '^CREATED:' 's_init empty-resource exception'

    $missingUrlProject = New-TestProject 'missing_url'
    Add-SlugResourceRoot $missingUrlProject | Out-Null
    $missingUrl = Invoke-Initializer $missingUrlProject
    Assert-Result $missingUrl 2 '^NEEDS_PROJECT_INFO_INPUT: competitorUrl\s*$' 'missing URL'
    Assert-NoProjectInfo $missingUrlProject 'missing URL'

    $invalidUrlProject = New-TestProject 'invalid_url'
    Add-SlugResourceRoot $invalidUrlProject | Out-Null
    $invalidUrl = Invoke-Initializer $invalidUrlProject 'relative/url'
    Assert-Result $invalidUrl 1 '^INVALID_PROJECT_INFO_INPUT: competitorUrl must be an absolute HTTP\(S\) URL' 'invalid URL'
    Assert-NoProjectInfo $invalidUrlProject 'invalid URL'

    $docFileProject = New-TestProject 'doc_file'
    Add-SlugResourceRoot $docFileProject | Out-Null
    [IO.File]::WriteAllText((Join-Path $docFileProject 'doc'), 'not a directory')
    $docFile = Invoke-Initializer $docFileProject 'https://competitor.example/doc-file'
    Assert-Result $docFile 1 '^INVALID_PROJECT_INFO_INPUT: doc path must be a directory' 'doc path is a file'

    $nonSlugProject = New-NonSlugTestProject 'non_slug'
    Add-ResourceRoot $nonSlugProject 'only' | Out-Null
    $nonSlug = Invoke-Initializer $nonSlugProject 'https://competitor.example/non-slug' 'only'
    Assert-Result $nonSlug 1 '^INVALID_PROJECT_INFO_INPUT: target project name must match slot-fe-' 'non-slug project'
    Assert-NoProjectInfo $nonSlugProject 'non-slug project'

    $illegalGameIdProject = New-TestProject 'illegal_game_id'
    Add-SlugResourceRoot $illegalGameIdProject | Out-Null
    $illegalGameId = Invoke-Initializer $illegalGameIdProject 'https://competitor.example/game' '../bad'
    Assert-Result $illegalGameId 1 '^INVALID_PROJECT_INFO_INPUT: gameId may contain only' 'illegal gameId'

    $missingResourceProject = New-TestProject 'missing_resource'
    $missingResource = Invoke-Initializer $missingResourceProject 'https://competitor.example/game'
    Assert-Result $missingResource 1 '^INVALID_PROJECT_INFO_INPUT: missing corresponding resource root' 'missing replicationId resource root'
    Assert-NoProjectInfo $missingResourceProject 'missing replicationId resource root'

    $existingProject = New-TestProject 'existing'
    Add-SlugResourceRoot $existingProject | Out-Null
    [IO.Directory]::CreateDirectory((Join-Path $existingProject 'doc')) | Out-Null
    $existingPath = Join-Path $existingProject 'doc\project_info.md'
    [IO.File]::WriteAllText($existingPath, 'sentinel')
    $existing = Invoke-Initializer $existingProject 'https://competitor.example/new' 'new'
    Assert-Result $existing 0 '^EXISTS:' 'existing no-overwrite'
    if ([IO.File]::ReadAllText($existingPath) -ne 'sentinel') { throw 'existing project_info.md was overwritten' }

    $existingMissingResourceProject = New-TestProject 'existing_missing_resource'
    [IO.Directory]::CreateDirectory((Join-Path $existingMissingResourceProject 'doc')) | Out-Null
    $existingMissingResourcePath = Join-Path $existingMissingResourceProject 'doc\project_info.md'
    [IO.File]::WriteAllText($existingMissingResourcePath, 'sentinel')
    $existingMissingResource = Invoke-Initializer $existingMissingResourceProject 'https://competitor.example/existing'
    Assert-Result $existingMissingResource 1 '^INVALID_PROJECT_INFO_INPUT: missing corresponding resource root' 'existing file still requires replicationId resource root'
    if ([IO.File]::ReadAllText($existingMissingResourcePath) -ne 'sentinel') {
        throw 'existing project_info.md changed after resource-root rejection'
    }

    $nestedResourceReparseProject = New-TestProject 'nested_resource_reparse'
    $nestedResourceRoot = Add-SlugResourceRoot $nestedResourceReparseProject
    $nestedResourceTarget = Join-Path ([IO.Path]::GetTempPath()) ('s_cli_project_info_resource_junction_{0}' -f ([guid]::NewGuid().ToString('N')))
    [IO.Directory]::CreateDirectory($nestedResourceTarget) | Out-Null
    [IO.File]::WriteAllText((Join-Path $nestedResourceTarget 'external.dat'), 'external')
    $outsidePaths.Add($nestedResourceTarget)
    $nestedResourceJunction = Join-Path $nestedResourceRoot 'external-link'
    try {
        New-Item -ItemType Junction -Path $nestedResourceJunction -Target $nestedResourceTarget -Force | Out-Null
        $junctionPaths.Add($nestedResourceJunction)
        $nestedResourceReparse = Invoke-Initializer $nestedResourceReparseProject 'https://competitor.example/nested-resource'
        Assert-Result $nestedResourceReparse 1 '^INVALID_PROJECT_INFO_INPUT: resource root cannot contain a reparse point' 'nested resource reparse'
        $nestedResourceReparseForSInit = Invoke-Initializer `
            -Project $nestedResourceReparseProject `
            -Url 'https://competitor.example/nested-resource' `
            -AllowMissingResourceForSInit
        Assert-Result $nestedResourceReparseForSInit 1 '^INVALID_PROJECT_INFO_INPUT: resource root cannot contain a reparse point' 'nested resource reparse for s_init'
        Assert-NoProjectInfo $nestedResourceReparseProject 'nested resource reparse'
    } catch {
        if (Test-Path -LiteralPath $nestedResourceJunction) { throw }
        Write-Output "SKIP: nested resource reparse test unavailable: $($_.Exception.Message)"
    }

    $outsideProject = Join-Path ([IO.Path]::GetTempPath()) ('s_cli_project_info_outside_{0}' -f ([guid]::NewGuid().ToString('N')))
    [IO.Directory]::CreateDirectory($outsideProject) | Out-Null
    $outsidePaths.Add($outsideProject)
    $outside = Invoke-Initializer $outsideProject 'https://competitor.example/outside' 'outside'
    Assert-Result $outside 1 '^INVALID_PROJECT_INFO_INPUT: target project must be a direct child' 'outside repository'

    $nestedParent = New-TestProject 'nested_parent'
    $nestedProject = Join-Path $nestedParent 'nested'
    [IO.Directory]::CreateDirectory($nestedProject) | Out-Null
    $nested = Invoke-Initializer $nestedProject 'https://competitor.example/nested' 'nested'
    Assert-Result $nested 1 '^INVALID_PROJECT_INFO_INPUT: target project must be a direct child' 'nested other project'

    $reparseProject = New-TestProject 'reparse'
    Add-SlugResourceRoot $reparseProject | Out-Null
    $junctionTarget = Join-Path ([IO.Path]::GetTempPath()) ('s_cli_project_info_junction_{0}' -f ([guid]::NewGuid().ToString('N')))
    [IO.Directory]::CreateDirectory($junctionTarget) | Out-Null
    $outsidePaths.Add($junctionTarget)
    $junctionPath = Join-Path $reparseProject 'doc'
    try {
        New-Item -ItemType Junction -Path $junctionPath -Target $junctionTarget -Force | Out-Null
        $junctionPaths.Add($junctionPath)
        $reparse = Invoke-Initializer $reparseProject 'https://competitor.example/reparse'
        Assert-Result $reparse 1 '^INVALID_PROJECT_INFO_INPUT: project_info path cannot traverse a reparse point' 'reparse path'
    } catch {
        if (Test-Path -LiteralPath $junctionPath) { throw }
        Write-Output "SKIP: reparse test unavailable: $($_.Exception.Message)"
    }
} finally {
    foreach ($junction in $junctionPaths) {
        if (Test-Path -LiteralPath $junction) { [IO.Directory]::Delete($junction) }
    }
    foreach ($project in $testProjects) {
        Assert-SafeProject $project
        if (Test-Path -LiteralPath $project) { Remove-Item -LiteralPath $project -Recurse -Force }
    }
    foreach ($outsidePath in $outsidePaths) {
        $canonicalOutside = Get-CanonicalPath $outsidePath
        if (-not (Split-Path -Leaf $canonicalOutside).StartsWith('s_cli_project_info_', [StringComparison]::Ordinal)) {
            throw "Unsafe outside cleanup path: $canonicalOutside"
        }
        if (Test-Path -LiteralPath $canonicalOutside) { Remove-Item -LiteralPath $canonicalOutside -Recurse -Force }
    }
}

foreach ($project in $testProjects) {
    if (Test-Path -LiteralPath $project) { throw "Cleanup failed: $project" }
}
Write-Output 'PASS: s_cli project_info initializer'
