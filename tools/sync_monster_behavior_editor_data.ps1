param(
    [string]$BehaviorCatalogPath = '',
    [string]$ManifestPath = '',
    [string]$ReviewExportRoot = '',
    [string]$MetaRoot = '',
    [string]$ImportedEditsPath = ''
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

function Get-RelativeUnixPath {
    param([string]$BasePath, [string]$TargetPath)
    $baseUri = [System.Uri]((Resolve-Path -LiteralPath $BasePath).Path.TrimEnd('\') + '\')
    $targetUri = [System.Uri](Resolve-Path -LiteralPath $TargetPath).Path
    return ($baseUri.MakeRelativeUri($targetUri).ToString())
}

$ProjectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($ReviewExportRoot)) {
    $ReviewExportRoot = Join-Path $ProjectRoot 'generated_assets\monster_review_export'
}
if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
    $ManifestPath = Join-Path $ReviewExportRoot 'manifest.json'
}
if ([string]::IsNullOrWhiteSpace($MetaRoot)) {
    $MetaRoot = Join-Path $ProjectRoot 'generated_assets\monster_behavior_preview\metadata'
}
if ([string]::IsNullOrWhiteSpace($BehaviorCatalogPath)) {
    $BehaviorCatalogPath = Join-Path $MetaRoot 'behavior-catalog.json'
}

$catalog = Get-Content -Path $BehaviorCatalogPath -Encoding UTF8 | ConvertFrom-Json
$manifest = Get-Content -Path $ManifestPath -Encoding UTF8 | ConvertFrom-Json
$entryMap = @{}
foreach ($entry in $manifest.entries) {
    $entryMap[$entry.variantId] = $entry
}

$editorData = @()
foreach ($item in $catalog) {
    $entry = $entryMap[$item.variantId]
    $sourceFrames = @()
    if ($entry) {
        $variantDir = Join-Path $ReviewExportRoot ($entry.path -replace '/', '\')
        if (Test-Path -LiteralPath $variantDir) {
            $sourceFrames = @(
                Get-ChildItem -LiteralPath $variantDir -File |
                Sort-Object Name |
                ForEach-Object { Get-RelativeUnixPath -BasePath $ProjectRoot -TargetPath $_.FullName }
            )
        }
    }
    $editorData += [PSCustomObject]@{
        variantId = $item.variantId
        category = $item.category
        monster = $item.monster
        version = $item.version
        sourceKey = $item.sourceKey
        layout = $item.layout
        rowMeans = $item.rowMeans
        sourceFrames = $sourceFrames
        behaviors = $item.behaviors
    }
}

$editsPayload = [PSCustomObject]@{
    exportedAt = $null
    source = $BehaviorCatalogPath
    behaviors = @()
}
if (-not [string]::IsNullOrWhiteSpace($ImportedEditsPath) -and (Test-Path -LiteralPath $ImportedEditsPath)) {
    $editsPayload = Get-Content -Path $ImportedEditsPath -Encoding UTF8 | ConvertFrom-Json
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $MetaRoot 'behavior-editor-data.json'), ($editorData | ConvertTo-Json -Depth 12), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $MetaRoot 'behavior-editor-data.js'), ("window.MONSTER_BEHAVIOR_EDITOR_DATA = " + ($editorData | ConvertTo-Json -Depth 12) + ";"), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $MetaRoot 'behavior-edits.json'), ($editsPayload | ConvertTo-Json -Depth 12), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $MetaRoot 'behavior-edits.js'), ("window.MONSTER_BEHAVIOR_EDITS = " + ($editsPayload | ConvertTo-Json -Depth 12) + ";"), $utf8NoBom)

Write-Output ("Editor variants: " + $editorData.Count)
Write-Output ("Imported edits: " + (@($editsPayload.behaviors).Count))
