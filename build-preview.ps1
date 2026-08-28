$ErrorActionPreference = 'Stop'

$repoRoot = $PSScriptRoot
$artifactRoot = Join-Path $repoRoot 'artifacts'
$stageRoot = Join-Path $artifactRoot '.preview-staging'
$zipPath = Join-Path $artifactRoot 'ashenspire-council-preview-r1.zip'
$manifestPath = Join-Path $artifactRoot 'preview-manifest.json'

& (Join-Path $repoRoot 'verify.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preview was not packaged.' }

New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null
if (Test-Path -LiteralPath $stageRoot) { Remove-Item -LiteralPath $stageRoot -Recurse -Force }
New-Item -ItemType Directory -Path $stageRoot | Out-Null

$items = @('README.md','CHANGELOG.md','CONTRIBUTING.md','SECURITY.md','start.ps1','verify.ps1','backend\app','backend\main.py','backend\pyproject.toml','backend\uv.lock','backend\tests','data','docs','frontend\dist','frontend\package.json','frontend\package-lock.json')
foreach ($item in $items) {
    $source = Join-Path $repoRoot $item
    if (-not (Test-Path -LiteralPath $source)) { throw "Missing preview input: $item" }
    $destination = Join-Path $stageRoot $item
    $destinationParent = Split-Path -Parent $destination
    New-Item -ItemType Directory -Force -Path $destinationParent | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
}

Get-ChildItem -LiteralPath $stageRoot -Recurse -Force | Where-Object {
    $_.Name -in @('__pycache__','.pytest_cache') -or $_.Extension -in @('.pyc','.pyo')
} | Sort-Object FullName -Descending | Remove-Item -Recurse -Force

$blocked = Get-ChildItem -LiteralPath $stageRoot -Recurse -Force | Where-Object {
    $_.Name -in @('.env.local','node_modules','.venv','.uv-cache','.uv-python','.pytest_cache') -or $_.Extension -eq '.sqlite3'
}
if ($blocked) { throw "Blocked private or generated content entered preview staging: $($blocked.FullName -join ', ')" }

if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
Compress-Archive -Path (Join-Path $stageRoot '*') -DestinationPath $zipPath -CompressionLevel Optimal
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash
$manifest = [ordered]@{
    artifact = 'ashenspire-council-preview-r1.zip'
    version = '0.1.0-preview.1'
    created_utc = (Get-Date).ToUniversalTime().ToString('o')
    sha256 = $hash
    verification = 'verify.ps1 passed before packaging'
    release_status = 'PREVIEW ONLY / NOT RELEASED'
}
$manifest | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding utf8
Remove-Item -LiteralPath $stageRoot -Recurse -Force
Write-Host "Preview: $zipPath"
Write-Host "SHA-256: $hash"
