$ErrorActionPreference = 'Stop'

$appRoot = $PSScriptRoot
$frontendPath = Join-Path $appRoot 'frontend'
$backendPath = Join-Path $appRoot 'backend'
$env:UV_CACHE_DIR = Join-Path $backendPath '.uv-cache'

function Assert-Verification {
    param(
        [Parameter(Mandatory = $true)]
        [bool] $Condition,
        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Get-PngDimensions {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $signature = [byte[]] (137, 80, 78, 71, 13, 10, 26, 10)
    Assert-Verification ($bytes.Length -ge 24) "PWA icon is too short to be a PNG: $Path"
    for ($index = 0; $index -lt $signature.Length; $index++) {
        Assert-Verification ($bytes[$index] -eq $signature[$index]) "PWA icon has an invalid PNG signature: $Path"
    }

    $width = (([int] $bytes[16] -shl 24) -bor ([int] $bytes[17] -shl 16) -bor ([int] $bytes[18] -shl 8) -bor [int] $bytes[19])
    $height = (([int] $bytes[20] -shl 24) -bor ([int] $bytes[21] -shl 16) -bor ([int] $bytes[22] -shl 8) -bor [int] $bytes[23])
    return @{ Width = $width; Height = $height }
}

function Test-PwaArtifacts {
    param(
        [Parameter(Mandatory = $true)]
        [string] $DistPath
    )

    $requiredFiles = @(
        'index.html',
        'manifest.webmanifest',
        'sw.js',
        'pwa-register.js',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png',
        'icons/apple-touch-icon.png'
    )
    foreach ($relativePath in $requiredFiles) {
        $candidate = Join-Path $DistPath $relativePath
        Assert-Verification (Test-Path -LiteralPath $candidate -PathType Leaf) "Missing PWA build artifact: $relativePath"
        Assert-Verification ((Get-Item -LiteralPath $candidate).Length -gt 0) "Empty PWA build artifact: $relativePath"
    }

    $workboxChunks = @(Get-ChildItem -LiteralPath $DistPath -File -Filter 'workbox-*.js')
    Assert-Verification ($workboxChunks.Count -gt 0) 'Missing generated Workbox runtime chunk.'

    $manifestPath = Join-Path $DistPath 'manifest.webmanifest'
    try {
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    }
    catch {
        throw "PWA manifest is not valid JSON: $($_.Exception.Message)"
    }

    Assert-Verification ($manifest.name -eq 'AshenSpire Council') 'PWA manifest name must be AshenSpire Council.'
    Assert-Verification (-not [string]::IsNullOrWhiteSpace([string] $manifest.short_name)) 'PWA manifest short_name is required.'
    Assert-Verification ($manifest.id -eq '/AshenSpire-Council/') 'PWA manifest id must target the dedicated GitHub Pages app path.'
    Assert-Verification ($manifest.start_url -eq '/AshenSpire-Council/') 'PWA manifest start_url must target the dedicated GitHub Pages app path.'
    Assert-Verification ($manifest.scope -eq '/AshenSpire-Council/') 'PWA manifest scope must be limited to the dedicated GitHub Pages app path.'
    Assert-Verification ($manifest.display -eq 'standalone') 'PWA manifest display must be standalone.'
    Assert-Verification (@($manifest.icons).Count -ge 4) 'PWA manifest must declare the standard and maskable icon set.'

    $expectedIcons = @{
        'icons/icon-192.png' = @{ Size = '192x192'; Purpose = 'any' }
        'icons/icon-512.png' = @{ Size = '512x512'; Purpose = 'any' }
        'icons/maskable-192.png' = @{ Size = '192x192'; Purpose = 'maskable' }
        'icons/maskable-512.png' = @{ Size = '512x512'; Purpose = 'maskable' }
    }
    foreach ($expectedPath in $expectedIcons.Keys) {
        $expected = $expectedIcons[$expectedPath]
        $entry = @($manifest.icons) | Where-Object {
            ([string] $_.src -replace '^\./', '' -replace '^/', '') -eq $expectedPath
        } | Select-Object -First 1
        Assert-Verification ($null -ne $entry) "PWA manifest is missing icon declaration: $expectedPath"
        Assert-Verification ($entry.sizes -eq $expected.Size) "PWA manifest icon has wrong declared size: $expectedPath"
        Assert-Verification (([string] $entry.purpose).Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries) -contains $expected.Purpose) "PWA manifest icon has wrong purpose: $expectedPath"
    }

    $pngExpectations = @{
        'icons/icon-192.png' = 192
        'icons/icon-512.png' = 512
        'icons/maskable-192.png' = 192
        'icons/maskable-512.png' = 512
        'icons/apple-touch-icon.png' = 180
    }
    foreach ($relativePath in $pngExpectations.Keys) {
        $expectedDimension = $pngExpectations[$relativePath]
        $dimensions = Get-PngDimensions (Join-Path $DistPath $relativePath)
        Assert-Verification (($dimensions.Width -eq $expectedDimension) -and ($dimensions.Height -eq $expectedDimension)) "PWA icon dimensions must be ${expectedDimension}x${expectedDimension}: $relativePath"
    }

    $indexMarkup = Get-Content -LiteralPath (Join-Path $DistPath 'index.html') -Raw
    Assert-Verification ($indexMarkup -match 'rel=["'']manifest["'']') 'Built index does not link the web manifest.'
    Assert-Verification ($indexMarkup -match 'pwa-register\.js') 'Built index does not load the PWA registration helper.'
    Assert-Verification ($indexMarkup -match 'apple-touch-icon') 'Built index does not link the Apple touch icon.'

    $registrationScript = Get-Content -LiteralPath (Join-Path $DistPath 'pwa-register.js') -Raw
    foreach ($marker in @(
        'document.baseURI',
        'ashenspire:pwa-ready',
        'ashenspire:pwa-offline-ready',
        'ashenspire:pwa-update-ready',
        'ashenspire:pwa-error',
        'applyUpdate',
        'controllerchange',
        '127.0.0.1',
        'localhost',
        '[::1]'
    )) {
        Assert-Verification ($registrationScript.Contains($marker)) "PWA registration helper is missing required behavior marker: $marker"
    }

    $serviceWorker = Get-Content -LiteralPath (Join-Path $DistPath 'sw.js') -Raw
    foreach ($workboxChunk in $workboxChunks) {
        $runtimeModuleName = [System.IO.Path]::GetFileNameWithoutExtension($workboxChunk.Name)
        Assert-Verification ($serviceWorker.Contains($runtimeModuleName)) "Service worker does not reference generated runtime chunk: $($workboxChunk.Name)"
    }

    $manifestHash = (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash
    $workerHash = (Get-FileHash -LiteralPath (Join-Path $DistPath 'sw.js') -Algorithm SHA256).Hash
    Write-Host "PWA artifacts passed: manifest, service worker, $($workboxChunks.Count) Workbox runtime chunk(s), registration/update wiring, and five PNG icons."
    Write-Host "PWA candidate SHA-256: manifest=$manifestHash sw.js=$workerHash"
}

function Test-StaticPagesBoundary {
    param(
        [Parameter(Mandatory = $true)]
        [string] $DistPath
    )

    $disallowedExtensions = @('.sqlite', '.sqlite3', '.db', '.mp3', '.wav', '.ogg', '.m4a', '.webm', '.env')
    $unexpectedFiles = @(Get-ChildItem -LiteralPath $DistPath -Recurse -File | Where-Object {
        $disallowedExtensions -contains $_.Extension.ToLowerInvariant()
    })
    Assert-Verification ($unexpectedFiles.Count -eq 0) "Pages build contains backend, database, audio, or environment artifacts: $($unexpectedFiles.FullName -join ', ')"

    $textExtensions = @('.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.txt', '.map')
    $textFiles = @(Get-ChildItem -LiteralPath $DistPath -Recurse -File | Where-Object {
        $textExtensions -contains $_.Extension.ToLowerInvariant()
    })
    $forbiddenPatterns = [ordered]@{
        'OpenAI secret name' = 'OPENAI_API_KEY'
        'OpenAI secret value' = 'sk-[A-Za-z0-9_-]{20,}'
        'GitHub classic token' = 'gh[pousr]_[A-Za-z0-9]{20,}'
        'GitHub fine-grained token' = 'github_pat_[A-Za-z0-9_]{20,}'
        'private key material' = '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
        'Windows user path' = '(?i)C:[\\/]Users[\\/]'
        'Windows repository path' = '(?i)C:[\\/]repos[\\/]'
        'POSIX home path' = '(?i)/home/[^/\s]+/'
        'file URI' = '(?i)file://'
        'SQLite file signature' = 'SQLite format 3'
        'local backend origin' = '(?i)(?:127\.0\.0\.1|localhost|\[::1\]):8421'
    }
    foreach ($file in $textFiles) {
        $content = Get-Content -LiteralPath $file.FullName -Raw
        foreach ($label in $forbiddenPatterns.Keys) {
            Assert-Verification (-not [regex]::IsMatch($content, $forbiddenPatterns[$label])) "Pages build contains forbidden $label in $($file.FullName)."
        }
    }

    $appBundles = @(Get-ChildItem -LiteralPath (Join-Path $DistPath 'assets') -File -Filter '*.js' -ErrorAction SilentlyContinue)
    Assert-Verification ($appBundles.Count -gt 0) 'Pages build has no JavaScript application bundle to scan.'
    $backendPatterns = [ordered]@{
        'backend API endpoint' = '(?i)["'']/api(?:/|["''])'
        'backend audio endpoint' = '(?i)["'']/audio(?:/|["''])'
    }
    foreach ($file in $appBundles) {
        $content = Get-Content -LiteralPath $file.FullName -Raw
        foreach ($label in $backendPatterns.Keys) {
            Assert-Verification (-not [regex]::IsMatch($content, $backendPatterns[$label])) "Pages application bundle contains forbidden $label in $($file.FullName)."
        }
    }

    $serviceWorker = Get-Content -LiteralPath (Join-Path $DistPath 'sw.js') -Raw
    Assert-Verification (($serviceWorker -match 'api') -and ($serviceWorker -match 'audio')) 'Service worker is missing the declared API/audio navigation exclusions.'

    Write-Host "Pages static boundary passed: $($textFiles.Count) text artifact(s) and $($appBundles.Count) app bundle(s) scanned; no secrets, machine paths, SQLite/audio artifacts, or backend endpoints found."
}

Push-Location $backendPath
try {
    $pytestBaseTemp = Join-Path $env:UV_CACHE_DIR "pytest-basetemp-$PID"
    uv run pytest -p no:cacheprovider --basetemp $pytestBaseTemp
    if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed.' }
}
finally {
    Pop-Location
}

Push-Location $frontendPath
$hadDemoMode = Test-Path Env:VITE_DEMO_MODE
$previousDemoMode = $env:VITE_DEMO_MODE
try {
    Remove-Item Env:VITE_DEMO_MODE -ErrorAction SilentlyContinue
    npm test
    if ($LASTEXITCODE -ne 0) { throw 'Frontend tests failed.' }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend production build failed.' }

    $env:VITE_DEMO_MODE = 'true'
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend GitHub Pages demo build failed.' }
    Test-PwaArtifacts (Join-Path $frontendPath 'dist')
    Test-StaticPagesBoundary (Join-Path $frontendPath 'dist')

    Remove-Item Env:VITE_DEMO_MODE -ErrorAction SilentlyContinue
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend local-backend build restoration failed.' }
    Write-Host 'Restored frontend/dist to the normal local-backend build after Pages verification.'
}
finally {
    if ($hadDemoMode) {
        $env:VITE_DEMO_MODE = $previousDemoMode
    }
    else {
        Remove-Item Env:VITE_DEMO_MODE -ErrorAction SilentlyContinue
    }
    Pop-Location
}

Write-Host 'AshenSpire Council verification passed.'
