$ErrorActionPreference = 'Stop'

$appRoot = $PSScriptRoot
$frontendPath = Join-Path $appRoot 'frontend'
$backendPath = Join-Path $appRoot 'backend'
$env:UV_CACHE_DIR = Join-Path $backendPath '.uv-cache'

Push-Location $backendPath
try {
    uv run pytest
    if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed.' }
}
finally {
    Pop-Location
}

Push-Location $frontendPath
try {
    npm test
    if ($LASTEXITCODE -ne 0) { throw 'Frontend tests failed.' }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend production build failed.' }
}
finally {
    Pop-Location
}

Write-Host 'AshenSpire Council verification passed.'
