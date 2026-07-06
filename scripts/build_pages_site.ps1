param(
  [string]$Output = "dist-pages",
  [string]$GameFolderName = "eve"
)

$ErrorActionPreference = "Stop"

if ($GameFolderName -notmatch "^[A-Za-z0-9_-]+$") {
  throw "GameFolderName may only contain letters, numbers, underscores, and hyphens."
}

$root = Split-Path -Parent $PSScriptRoot
$outputPath = [System.IO.Path]::GetFullPath((Join-Path $root $Output))
$rootFull = [System.IO.Path]::GetFullPath($root)
$rootWithSlash = $rootFull.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

if ($outputPath -eq $rootFull -or -not $outputPath.StartsWith($rootWithSlash, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Output must stay inside the Eve workspace."
}

if (Test-Path -LiteralPath $outputPath) {
  Remove-Item -LiteralPath $outputPath -Recurse -Force
}

New-Item -ItemType Directory -Path $outputPath | Out-Null

function Copy-FilePreservingPath {
  param(
    [string]$SourceRoot,
    [string]$RelativePath,
    [string]$DestinationRoot
  )

  $source = Join-Path $SourceRoot $RelativePath
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    Write-Warning "Missing asset: $RelativePath"
    return
  }

  $destination = Join-Path $DestinationRoot $RelativePath
  $destinationDir = Split-Path -Parent $destination
  New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

function Remove-SourceRun {
  param([object]$Node)

  if ($null -eq $Node -or $Node -is [string]) {
    return
  }

  if ($Node -is [System.Array]) {
    foreach ($item in $Node) {
      Remove-SourceRun $item
    }
    return
  }

  if ($Node -is [pscustomobject]) {
    if ($Node.PSObject.Properties["source_run"]) {
      $Node.PSObject.Properties.Remove("source_run")
    }
    foreach ($property in @($Node.PSObject.Properties)) {
      Remove-SourceRun $property.Value
    }
  }
}

$landing = Get-Content (Join-Path $root "index.html") -Raw
$landing = $landing -replace "\./eve/", "./$GameFolderName/"
[System.IO.File]::WriteAllText((Join-Path $outputPath "index.html"), $landing, [System.Text.UTF8Encoding]::new($false))

$landingCss = Get-Content (Join-Path $root "landing.css") -Raw
$landingCss = $landingCss -replace "\./eve/", "./$GameFolderName/"
[System.IO.File]::WriteAllText((Join-Path $outputPath "landing.css"), $landingCss, [System.Text.UTF8Encoding]::new($false))
Copy-Item -LiteralPath (Join-Path $root ".nojekyll") -Destination (Join-Path $outputPath ".nojekyll")

$mediaSource = Join-Path $root "assets\media"
if (Test-Path -LiteralPath $mediaSource) {
  New-Item -ItemType Directory -Path (Join-Path $outputPath "assets") -Force | Out-Null
  Copy-Item -LiteralPath $mediaSource -Destination (Join-Path $outputPath "assets\media") -Recurse -Force
}

$codexSource = Join-Path $root "codex-city"
if (Test-Path -LiteralPath $codexSource) {
  Copy-Item -LiteralPath $codexSource -Destination (Join-Path $outputPath "codex-city") -Recurse -Force
}

$gameSource = Join-Path $root "eve"
$gameDestination = Join-Path $outputPath $GameFolderName
New-Item -ItemType Directory -Path $gameDestination | Out-Null

Copy-Item -LiteralPath (Join-Path $gameSource "index.html") -Destination (Join-Path $gameDestination "index.html")
Copy-Item -LiteralPath (Join-Path $gameSource "styles.css") -Destination (Join-Path $gameDestination "styles.css")
Copy-Item -LiteralPath (Join-Path $gameSource "src") -Destination (Join-Path $gameDestination "src") -Recurse
Copy-Item -LiteralPath (Join-Path $gameSource "data") -Destination (Join-Path $gameDestination "data") -Recurse

$manifestPath = Join-Path $gameSource "data\asset_manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$assetPaths = [ordered]@{}

foreach ($entry in $manifest.images.PSObject.Properties) {
  $path = $entry.Value.path
  if ($path) {
    $assetPaths[$path] = $true
  }
}

foreach ($entry in $manifest.atlases.PSObject.Properties) {
  $path = $entry.Value.path
  if ($path) {
    $assetPaths[$path] = $true
  }
}

foreach ($assetPath in $assetPaths.Keys) {
  Copy-FilePreservingPath -SourceRoot $gameSource -RelativePath $assetPath -DestinationRoot $gameDestination
}

$deployManifestPath = Join-Path $gameDestination "data\asset_manifest.json"
$deployManifest = Get-Content $deployManifestPath -Raw | ConvertFrom-Json
Remove-SourceRun $deployManifest
$manifestJson = $deployManifest | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText($deployManifestPath, $manifestJson, [System.Text.UTF8Encoding]::new($false))

Write-Host "Built Pages site at $outputPath"
Write-Host "Landing page: $outputPath\index.html"
Write-Host "Game path: $outputPath\$GameFolderName\index.html"
