$ErrorActionPreference = 'Stop'

$toolRoot = Join-Path $PSScriptRoot 'tools\github-mobile-handoff'
$env:npm_config_cache = Join-Path $PSScriptRoot '.npm-cache'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI is required.'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm is required to render the QR code locally.'
}

Push-Location $toolRoot
try {
    if (-not (Test-Path -LiteralPath (Join-Path $toolRoot 'node_modules\qrcode-terminal'))) {
        npm install --ignore-scripts
        if ($LASTEXITCODE -ne 0) { throw 'Mobile handoff dependency installation failed.' }
    }
    npm test
    if ($LASTEXITCODE -ne 0) { throw 'Mobile handoff self-test failed.' }
    npm start
    if ($LASTEXITCODE -ne 0) { throw 'GitHub mobile handoff did not complete.' }
}
finally {
    Pop-Location
}
