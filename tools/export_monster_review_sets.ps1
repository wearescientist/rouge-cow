param(
    [string]$ReviewJsonPath = 'C:\Users\39215\Downloads\monster-review-2026-03-09-03-44-47.json',
    [string]$CatalogPath = '',
    [string]$OutRoot = ''
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Remove-DirectoryContents {
    param([string]$Path)
    if (Test-Path -LiteralPath $Path) {
        Get-ChildItem -LiteralPath $Path -Force | Remove-Item -Force -Recurse
    }
}

function Get-ShortVersionName {
    param([string]$SourceKey)
    if ($SourceKey -match '^monsters_v(\d+)_') {
        return ('v{0}' -f $Matches[1])
    }
    if ($SourceKey -eq 'monsters_sprites_sheet') { return 'spr' }
    if ($SourceKey -eq 'monsters_sprites_v2_sheet') { return 'spr2' }
    if ($SourceKey -eq 'monsters_single') { return 'single' }
    return ($SourceKey -replace '^monsters_', '' -replace '_sheet$', '' -replace '_image$', '')
}

function Get-CategoryFolderName {
    param([string]$Status)
    switch ($Status) {
        'ready' { return 'ready' }
        'needs_work' { return 'needs_work' }
        'pending' { return 'pending' }
        default { return $null }
    }
}

$ProjectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($CatalogPath)) {
    $CatalogPath = Join-Path $ProjectRoot 'generated_assets\monster_preview\metadata\catalog.json'
}
if ([string]::IsNullOrWhiteSpace($OutRoot)) {
    $OutRoot = Join-Path $ProjectRoot 'generated_assets\monster_review_export'
}

if (-not (Test-Path -LiteralPath $ReviewJsonPath)) {
    throw "Review json not found: $ReviewJsonPath"
}
if (-not (Test-Path -LiteralPath $CatalogPath)) {
    throw "Catalog json not found: $CatalogPath"
}

Ensure-Directory -Path $OutRoot
Remove-DirectoryContents -Path $OutRoot

$review = Get-Content -Path $ReviewJsonPath -Encoding UTF8 | ConvertFrom-Json
$catalog = Get-Content -Path $CatalogPath -Encoding UTF8 | ConvertFrom-Json
$catalogMap = @{}
foreach ($entry in $catalog) {
    $catalogMap[$entry.variantId] = $entry
}

$manifestEntries = @()

foreach ($row in $review.classifications) {
    $category = Get-CategoryFolderName -Status $row.status
    if (-not $category) { continue }
    if (-not $catalogMap.ContainsKey($row.variantId)) { continue }

    $entry = $catalogMap[$row.variantId]
    $monsterDir = Join-Path $OutRoot "$category\$($entry.id)"
    $versionDir = Join-Path $monsterDir (Get-ShortVersionName -SourceKey $entry.sourceKey)
    Ensure-Directory -Path $versionDir

    $copiedFrames = @()
    for ($i = 0; $i -lt $entry.frames.Count; $i++) {
        $sourceFrame = Join-Path $ProjectRoot ($entry.frames[$i] -replace '/', '\')
        if (-not (Test-Path -LiteralPath $sourceFrame)) { continue }
        $targetName = 'f{0:d2}.png' -f ($i + 1)
        $targetPath = Join-Path $versionDir $targetName
        Copy-Item -LiteralPath $sourceFrame -Destination $targetPath -Force
        $copiedFrames += $targetName
    }

    $manifestEntries += [PSCustomObject][ordered]@{
        category = $category
        monster = $entry.id
        version = (Get-ShortVersionName -SourceKey $entry.sourceKey)
        variantId = $entry.variantId
        sourceKey = $entry.sourceKey
        frameCount = $copiedFrames.Count
        layout = $entry.layout
        path = "$category/$($entry.id)/$(Get-ShortVersionName -SourceKey $entry.sourceKey)"
    }
}

$summary = [PSCustomObject][ordered]@{
    exportedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    reviewJson = $ReviewJsonPath
    totalVariants = $manifestEntries.Count
    totalFrames = (($manifestEntries | Measure-Object frameCount -Sum).Sum)
    categories = @(
        $manifestEntries |
        Group-Object category |
        Sort-Object Name |
        ForEach-Object {
            [PSCustomObject][ordered]@{
                category = $_.Name
                variants = $_.Count
                frames = (($_.Group | Measure-Object frameCount -Sum).Sum)
            }
        }
    )
    entries = $manifestEntries
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $OutRoot 'manifest.json'), ($summary | ConvertTo-Json -Depth 10), $utf8NoBom)

Write-Output ("Exported variants: " + $manifestEntries.Count)
Write-Output ("Exported frames: " + (($manifestEntries | Measure-Object frameCount -Sum).Sum))
