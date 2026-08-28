$ErrorActionPreference = 'Stop'

$appRoot = $PSScriptRoot
$frontendPath = Join-Path $appRoot 'frontend'
$backendPath = Join-Path $appRoot 'backend'
$frontendDist = Join-Path $frontendPath 'dist\index.html'
$env:UV_CACHE_DIR = Join-Path $backendPath '.uv-cache'

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm is required to build the AshenSpire Council frontend.'
}

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    throw 'uv is required to run the AshenSpire Council backend.'
}

if (-not (Test-Path -LiteralPath $frontendDist -PathType Leaf)) {
    Push-Location $frontendPath
    try {
        npm install
        if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend production build failed.' }
    }
    finally {
        Pop-Location
    }
}

Push-Location $backendPath
try {
    Write-Host 'AshenSpire Council is starting at http://127.0.0.1:8421'
    Write-Host 'Keep this window open. Press Ctrl+C to stop the server.'
    uv run python main.py
    if ($LASTEXITCODE -ne 0) { throw 'AshenSpire Council backend exited with an error.' }
}
finally {
    Pop-Location
}
