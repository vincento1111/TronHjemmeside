[CmdletBinding()]
param(
    [string]$BackendPath,
    [ValidateRange(1024, 65535)][int]$Port = 5077,
    [switch]$NoBrowser,
    [switch]$SkipBuild,
    [switch]$Restart
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not $BackendPath) { $BackendPath = Join-Path (Split-Path $repoRoot -Parent) 'TronApiV2' }
$backendRoot = (Resolve-Path -LiteralPath $BackendPath).Path
$project = Join-Path $backendRoot 'TronApi\TronApi.csproj'
if (-not (Test-Path -LiteralPath $project)) { throw "Backend project not found: $project" }
$localRoot = Join-Path $repoRoot '.local'
New-Item -ItemType Directory -Force -Path $localRoot | Out-Null
$url = "http://localhost:$Port"
if ($Restart) { & (Join-Path $PSScriptRoot 'Stop-Tron.ps1') }
$stateFile = Join-Path $localRoot 'server.json'
if (Test-Path -LiteralPath $stateFile) {
    $recorded = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    if ($recorded.url -ne $url -and (Get-Process -Id ([int]$recorded.processId) -ErrorAction SilentlyContinue)) {
        throw "A managed server is already recorded at $($recorded.url). Use -Restart to change ports."
    }
}
try { $health = Invoke-RestMethod "$url/api/health" -TimeoutSec 2 } catch { $health = $null }
if ($health -and $health.application -eq 'TronCity') {
    Write-Host "Tron City is already running at $url"
    if (-not $NoBrowser) { Start-Process $url }
    return
}
if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
    throw "Port $Port is occupied by another application. Choose -Port with a free port."
}

# Prefer an installed .NET 10 SDK; keep a fallback SDK local to this checkout.
$dotnetCandidates = @(
    (Join-Path $repoRoot '.tools\dotnet\dotnet.exe'),
    (Join-Path (Split-Path (Split-Path $repoRoot -Parent) -Parent) '.tools\dotnet\dotnet.exe')
)
$systemDotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if ($systemDotnet) { $dotnetCandidates += $systemDotnet.Source }
$dotnetExe = $null
foreach ($candidate in $dotnetCandidates) {
    if ((Test-Path -LiteralPath $candidate) -and ((& $candidate --list-sdks) -match '^10\.')) {
        $dotnetExe = $candidate
        break
    }
}
if (-not $dotnetExe) {
    $installRoot = Join-Path $repoRoot '.tools\dotnet'
    New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
    Write-Host 'Installing a local .NET 10 SDK (no administrator access needed)...'
    $metadata = Invoke-RestMethod 'https://builds.dotnet.microsoft.com/dotnet/release-metadata/10.0/releases.json'
    $sdk = $metadata.releases[0].sdk
    $download = $sdk.files | Where-Object { $_.rid -eq 'win-x64' -and $_.name.EndsWith('.zip') } | Select-Object -First 1
    if (-not $download) { throw 'No Windows x64 SDK download found.' }
    $archive = Join-Path $repoRoot '.tools\dotnet-sdk.zip'
    Invoke-WebRequest -Uri $download.url -OutFile $archive -UseBasicParsing
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA512).Hash -ne $download.hash) {
        throw 'Downloaded SDK failed its SHA512 check.'
    }
    Expand-Archive -LiteralPath $archive -DestinationPath $installRoot -Force
    $dotnetExe = Join-Path $installRoot 'dotnet.exe'
}
$env:DOTNET_ROOT = Split-Path $dotnetExe -Parent
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:PATH = "$env:DOTNET_ROOT;$env:PATH"
$outputDll = Join-Path $backendRoot 'TronApi\bin\Release\net10.0\TronApi.dll'
$webRoot = Join-Path $backendRoot 'TronApi\wwwroot'
if (-not $SkipBuild) {
    $runtimeRoot = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
    $bundledNode = Join-Path $runtimeRoot 'node\bin'
    function Test-NodeVersion {
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $false }
        try {
            $version = [version]((& node --version).TrimStart('v'))
            return $version -ge [version]'24.15.0' -and $version -lt [version]'25.0.0'
        } catch { return $false }
    }
    if (-not (Test-NodeVersion) -and (Test-Path -LiteralPath $bundledNode)) {
        $env:PATH = "$bundledNode;$env:PATH"
    }
    if (-not (Test-NodeVersion)) { throw 'Node.js 24.15 or newer in the 24.x line is required.' }
    $packageManager = Get-Command pnpm -ErrorAction SilentlyContinue
    if (-not $packageManager) {
        $bundledPnpm = Join-Path $runtimeRoot 'bin\fallback\pnpm.cmd'
        if (Test-Path -LiteralPath $bundledPnpm) { $packageManager = Get-Item -LiteralPath $bundledPnpm }
    }
    if (-not $packageManager) { throw 'Install Node.js 24 and pnpm 11, then run this launcher again.' }
    $pnpmPath = if ($packageManager.Source) { $packageManager.Source } else { $packageManager.FullName }
    Push-Location $repoRoot
    try {
        & $pnpmPath install --frozen-lockfile
        if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
        & $pnpmPath build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
    } finally { Pop-Location }
    $browserBuild = Join-Path $repoRoot 'dist\tron-city\browser'
    if (-not (Test-Path -LiteralPath (Join-Path $browserBuild 'index.html'))) { throw 'Frontend build output is missing.' }
    New-Item -ItemType Directory -Force -Path $webRoot | Out-Null
    # Copy generated assets only; saves live in App_Data and are never reset here.
    Get-ChildItem -LiteralPath $browserBuild | Copy-Item -Destination $webRoot -Recurse -Force
    & $dotnetExe build $project -c Release --nologo
    if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
}
if (-not (Test-Path -LiteralPath $outputDll) -or -not (Test-Path -LiteralPath (Join-Path $webRoot 'index.html'))) {
    throw 'Built application is missing. Run without -SkipBuild first.'
}
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = $url
$env:Tron__SeedDemo = 'true'
$env:Tron__DatabasePath = 'App_Data/tron-city.db'
$stdout = Join-Path $localRoot 'server.log'
$stderr = Join-Path $localRoot 'server-error.log'
$server = Start-Process -FilePath $dotnetExe -ArgumentList ('"' + $outputDll + '"') -WorkingDirectory (Join-Path $backendRoot 'TronApi') -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
@{ processId = $server.Id; dllPath = $outputDll; url = $url } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $localRoot 'server.json') -Encoding UTF8
$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try {
        $health = Invoke-RestMethod "$url/api/health" -TimeoutSec 2
        if ($health.application -eq 'TronCity') { $ready = $true; break }
    } catch { }
    if ($server.HasExited) { break }
    Start-Sleep -Milliseconds 500
}
if (-not $ready) { throw "Server did not become ready. Read $stderr and $stdout" }
Write-Host "Tron City is running at $url"
Write-Host 'Demo accounts: vince@tron.local or nova@tron.local / TronLocal!2026'
Write-Host 'Your progress is saved in TronApiV2\TronApi\App_Data\tron-city.db.'
Write-Host 'Use Stop-Tron.cmd when you want to stop the local server.'
if (-not $NoBrowser) { Start-Process $url }
