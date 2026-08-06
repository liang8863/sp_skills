[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Addr,
  [switch]$WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-ExistingFullPath([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
    throw "Directory not found: $Path"
  }
  return (Resolve-Path -LiteralPath $Path).Path
}

function Copy-Tree([string]$SourceRoot, [string]$TargetRoot) {
  $args = @(
    $SourceRoot, $TargetRoot, "/E", "/COPY:DAT", "/DCOPY:DAT",
    "/R:0", "/W:0", "/NFL", "/NDL", "/NJH", "/NJS", "/NP"
  )
  & robocopy @args | Out-Null
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed ($LASTEXITCODE): $SourceRoot -> $TargetRoot"
  }
}

function Copy-BridgeTree([string]$SourceRoot, [string]$TargetRoot) {
  $args = @(
    $SourceRoot, $TargetRoot, "/E", "/COPY:DAT", "/DCOPY:DAT",
    "/XF", ".git", "/R:0", "/W:0", "/NFL", "/NDL", "/NJH", "/NJS", "/NP"
  )
  & robocopy @args | Out-Null
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy bridge failed ($LASTEXITCODE): $SourceRoot -> $TargetRoot"
  }
}

function Find-BridgeSource([string]$ParentPath, [string]$SourcePath, [string]$TemplateBridgePath) {
  if ((Test-Path -LiteralPath (Join-Path $TemplateBridgePath "Loader.ts") -PathType Leaf) -and
      (Test-Path -LiteralPath (Join-Path $TemplateBridgePath "ServiceBridge.ts") -PathType Leaf) -and
      (Test-Path -LiteralPath (Join-Path $TemplateBridgePath "components/i18n/LanguageData.ts") -PathType Leaf)) {
    return $TemplateBridgePath
  }

  foreach ($candidate in @(Get-ChildItem -LiteralPath $ParentPath -Directory)) {
    if ($candidate.FullName -eq $SourcePath) { continue }
    $candidateBridge = Join-Path $candidate.FullName "assets/scripts/bridge"
    if ((Test-Path -LiteralPath (Join-Path $candidateBridge "Loader.ts") -PathType Leaf) -and
        (Test-Path -LiteralPath (Join-Path $candidateBridge "ServiceBridge.ts") -PathType Leaf) -and
        (Test-Path -LiteralPath (Join-Path $candidateBridge "components/i18n/LanguageData.ts") -PathType Leaf)) {
      return $candidateBridge
    }
  }

  return $null
}

function Update-ProjectName([string]$ProjectPath, [string]$ProjectName) {
  if (-not (Test-Path -LiteralPath $ProjectPath -PathType Leaf)) { return }
  try {
    $project = Get-Content -LiteralPath $ProjectPath -Raw | ConvertFrom-Json
    $changed = $false
    foreach ($field in @("name", "projectName")) {
      $property = $project.PSObject.Properties[$field]
      if ($null -ne $property) {
        $property.Value = $ProjectName
        $changed = $true
      }
    }
    if ($changed) {
      $project | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $ProjectPath -Encoding UTF8
    }
  } catch {
    throw "Cannot update structured project identity: $ProjectPath. $($_.Exception.Message)"
  }
}

function Update-SceneConfigValue([object]$Value, [string]$SceneUuid, [string]$TemplateSceneUuid) {
  if ($null -eq $Value) { return $false }
  $changed = $false
  if ($Value -is [System.Collections.IList]) {
    foreach ($item in $Value) {
      if (Update-SceneConfigValue $item $SceneUuid $TemplateSceneUuid) { $changed = $true }
    }
  } elseif ($Value -is [pscustomobject]) {
    foreach ($property in @($Value.PSObject.Properties)) {
      if ($property.Name -eq "startScene") {
        if ($property.Value -ne $SceneUuid) {
          $property.Value = $SceneUuid
          $changed = $true
        }
      } elseif ($property.Name -eq "url" -and ($property.Value -eq "db://assets/scenes/mjhlGame.scene" -or $property.Value -eq "db://assets/mjhlGame.scene")) {
        $property.Value = "db://assets/scenes/main.scene"
        $changed = $true
      } elseif ($property.Name -eq "uuid" -and $property.Value -eq $TemplateSceneUuid) {
        $property.Value = $SceneUuid
        $changed = $true
      } elseif ($property.Value -is [System.Collections.IList] -or $property.Value -is [pscustomobject]) {
        if (Update-SceneConfigValue $property.Value $SceneUuid $TemplateSceneUuid) { $changed = $true }
      }
    }
  }
  return $changed
}

function Update-SceneConfig([string]$ProjectPath, [string]$SceneUuid, [string]$TemplateSceneUuid) {
  if (-not (Test-Path -LiteralPath $ProjectPath -PathType Leaf)) { return }
  try {
    $project = Get-Content -LiteralPath $ProjectPath -Raw | ConvertFrom-Json
    if (Update-SceneConfigValue $project $SceneUuid $TemplateSceneUuid) {
      $project | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $ProjectPath -Encoding UTF8
    }
  } catch {
    throw "Cannot update scene configuration: $ProjectPath. $($_.Exception.Message)"
  }
}

function Update-MigratedScriptBindings([string]$SourcePath, [string]$TargetPath) {
  $sourceScripts = Join-Path $SourcePath "assets/scripts"
  $targetTs3 = Join-Path $TargetPath "assets/scripts_ts3"
  $assetFiles = @(Get-ChildItem (Join-Path $TargetPath "assets") -Recurse -File -Include "*.scene", "*.prefab")
  if (-not (Test-Path -LiteralPath $sourceScripts -PathType Container) -or
      -not (Test-Path -LiteralPath $targetTs3 -PathType Container) -or
      -not $assetFiles.Count) { return }

  $uuidMap = @{}
  foreach ($jsMeta in @(Get-ChildItem $sourceScripts -Recurse -File -Filter "*.js.meta")) {
    $scriptName = $jsMeta.Name -replace "\.js\.meta$", ""
    $tsMeta = Get-ChildItem $targetTs3 -Recurse -File -Filter "$scriptName.ts.meta" | Select-Object -First 1
    if ($null -eq $tsMeta) { continue }
    $oldUuid = (Get-Content -LiteralPath $jsMeta.FullName -Raw | ConvertFrom-Json).uuid
    $newUuid = (Get-Content -LiteralPath $tsMeta.FullName -Raw | ConvertFrom-Json).uuid
    if ($oldUuid -and $newUuid -and $oldUuid -ne $newUuid) { $uuidMap[[string]$oldUuid] = [string]$newUuid }
  }

  foreach ($assetFile in $assetFiles) {
    $text = Get-Content -LiteralPath $assetFile.FullName -Raw
    $text | ConvertFrom-Json | Out-Null
    $updated = $text
    foreach ($entry in $uuidMap.GetEnumerator()) {
      $pattern = '"__type__"\s*:\s*"' + [regex]::Escape($entry.Key) + '"'
      $replacement = '"__type__": "' + $entry.Value + '"'
      $updated = [regex]::Replace($updated, $pattern, $replacement)
    }
    if ($updated -ne $text) {
      Set-Content -LiteralPath $assetFile.FullName -Value $updated -Encoding UTF8
      Write-Output "script-bindings=$($assetFile.FullName)"
    }
  }
}

$source = Get-ExistingFullPath $Addr
$sourceName = ([System.IO.DirectoryInfo]$source).Name
$nameMatch = [regex]::Match($sourceName, "^(?<name>.+)_UI$")
if (-not $nameMatch.Success) {
  throw "Source directory must end in _UI: $sourceName"
}
$name = $nameMatch.Groups["name"].Value
$sourceDirectory = Get-Item -LiteralPath $source
if ($null -eq $sourceDirectory.Parent -or $null -eq $sourceDirectory.Parent.Parent) {
  throw "Source must have two parent levels for addr/../../: $source"
}
$parent = $sourceDirectory.Parent.Parent.FullName
$template = Get-ExistingFullPath (Join-Path $parent "template")
$templateBridge = Join-Path $template "assets/scripts/bridge"
$bridgeSource = Find-BridgeSource $parent $source $templateBridge
if ($null -eq $bridgeSource) {
  throw "Template bridge submodule is empty and no initialized sibling bridge was found: $templateBridge"
}
$targetName = "slot-fe-$name"
$target = [System.IO.Path]::GetFullPath((Join-Path $parent $targetName))
$parentPrefix = ([System.IO.Path]::GetFullPath($parent)).TrimEnd("\") + "\"

if (-not $target.StartsWith($parentPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Target escapes source parent: $target"
}
if (Test-Path -LiteralPath $target) {
  throw "Target already exists; refusing to overwrite: $target"
}

$sourceTs3 = Join-Path $source "assets/scripts_ts3"
$sourceTs24 = Join-Path $source "assets/scripts_ts24"
$sourceFlow = Join-Path $source "doc"
if (-not (Test-Path -LiteralPath $sourceTs3 -PathType Container)) {
  throw "Translated TS3 output is missing: $sourceTs3"
}
if (-not (Test-Path -LiteralPath $sourceFlow -PathType Container) -or
    -not @(Get-ChildItem -LiteralPath $sourceFlow -Filter "*operation-flow.md" -File).Count) {
  throw "Translated operation-flow document is missing under: $sourceFlow"
}

$copyRoots = [System.Collections.Generic.List[string]]::new()
$copyRoots.Add("assets/scripts_ts3")
$copyRoots.Add("doc")
$discardedTs24 = Test-Path -LiteralPath $sourceTs24 -PathType Container
foreach ($root in @(
    "assets/prefabs", "assets/scenes", "assets/resources", "assets/import-materials",
    "assets/materials", "assets/animations", "assets/audio", "assets/spine",
    "assets/textures", "assets/atlas", "assets/effects", "assets/shaders"
  )) {
  if (Test-Path -LiteralPath (Join-Path $source $root) -PathType Container) {
    $copyRoots.Add($root)
  }
}

$conflicts = [System.Collections.Generic.List[object]]::new()
$identicalCount = 0
$newFileCount = 0
foreach ($root in $copyRoots) {
  $sourceRoot = Join-Path $source $root
  foreach ($file in @(Get-ChildItem -LiteralPath $sourceRoot -Recurse -File)) {
    $relative = $file.FullName.Substring($source.Length).TrimStart("\")
    $templateFile = Join-Path $template $relative
    if (Test-Path -LiteralPath $templateFile -PathType Leaf) {
      $sourceHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
      $templateHash = (Get-FileHash -LiteralPath $templateFile -Algorithm SHA256).Hash
      if ($sourceHash -eq $templateHash) {
        $identicalCount++
      } else {
        $conflicts.Add([pscustomobject]@{ Path = $relative; Source = $sourceHash; Template = $templateHash })
      }
    } else {
      $newFileCount++
    }
  }
}

Write-Output "source=$source"
Write-Output "template=$template"
Write-Output "target=$target"
Write-Output "name=$name"
Write-Output "copy-roots=$($copyRoots.Count) new-files=$newFileCount identical-files=$identicalCount conflicts=$($conflicts.Count)"
Write-Output "scripts-ts24=discarded source-present=$discardedTs24"
Write-Output "bridge-source=$bridgeSource"

if ($conflicts.Count) {
  $conflicts | Format-Table -AutoSize | Out-String | Write-Output
  throw "Template conflicts detected; target was not created. Resolve the listed files explicitly."
}
if ($WhatIf) {
  Write-Output "WHATIF: no files written."
  return
}

$templateArgs = @(
  $template, $target, "/E", "/COPY:DAT", "/DCOPY:DAT", "/XD",
  (Join-Path $template ".git"), (Join-Path $template "library"),
  (Join-Path $template "temp"), (Join-Path $template "build"),
  (Join-Path $template "node_modules"), "/R:0", "/W:0", "/NFL", "/NDL",
  "/NJH", "/NJS", "/NP"
)
& robocopy @templateArgs | Out-Null
if ($LASTEXITCODE -gt 7) {
  throw "Template copy failed ($LASTEXITCODE): $template -> $target"
}

if ($bridgeSource -ne $templateBridge) {
  Copy-BridgeTree $bridgeSource (Join-Path $target "assets/scripts/bridge")
}

foreach ($root in $copyRoots) {
  Copy-Tree (Join-Path $source $root) (Join-Path $target $root)
}

Update-ProjectName (Join-Path $target "package.json") $targetName
Update-ProjectName (Join-Path $target "project.json") $targetName

$sourceSceneMeta = Join-Path $source "assets/scenes/main.scene.meta"
if (Test-Path -LiteralPath $sourceSceneMeta -PathType Leaf) {
  $sceneUuid = (Get-Content -LiteralPath $sourceSceneMeta -Raw | ConvertFrom-Json).uuid
  $templateSceneMeta = Join-Path $template "assets/scenes/mjhlGame.scene.meta"
  $templateSceneUuid = ""
  if (Test-Path -LiteralPath $templateSceneMeta -PathType Leaf) {
    $templateSceneUuid = (Get-Content -LiteralPath $templateSceneMeta -Raw | ConvertFrom-Json).uuid
  }
  Update-SceneConfig (Join-Path $target "buildConfig_web-mobile.json") $sceneUuid $templateSceneUuid
  Update-SceneConfig (Join-Path $target "profiles/v2/packages/builder.json") $sceneUuid $templateSceneUuid
  Update-SceneConfig (Join-Path $target "profiles/v2/packages/web-mobile.json") $sceneUuid $templateSceneUuid
  Update-MigratedScriptBindings $source $target
  Write-Output "start-scene=assets/scenes/main.scene uuid=$sceneUuid"
}

$reportPath = Join-Path $target "doc/create-slot-migration.md"
@"
# Create Slot Migration

- Source: $source
- Template: $template
- Target: $target
- Derived name: $name
- Copied roots: $($copyRoots -join ', ')
- Bridge source: $bridgeSource
- Start scene: assets/scenes/main.scene
- Copied scripts_ts3: yes
- Copied scripts_ts24: no (discarded; source present: $discardedTs24)
- New files: $newFileCount
- Identical files skipped by hash: $identicalCount
- Conflicts: 0
- Original ``assets/scripts/*.js`` copied as active target scripts: no
- Formal Cocos script binding: mapped exact source JavaScript .meta UUIDs to matching TS3 .meta UUIDs in scenes/prefabs
- Runtime Spin verification: pending

The target was created from the sibling template. UUID-sensitive resources must be validated through Cocos Creator import/editor processing before formal binding changes.
"@ | Set-Content -LiteralPath $reportPath -Encoding UTF8

Write-Output "created=$target"
Write-Output "report=$reportPath"
