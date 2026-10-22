[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$statePath = Join-Path $repoRoot '.local\server.json'
if (-not (Test-Path -LiteralPath $statePath)) { Write-Host 'No launcher-managed server is recorded.'; return }
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$process = Get-CimInstance Win32_Process -Filter ("ProcessId = " + [int]$state.processId)
if ($process) {
    if (-not $process.CommandLine -or $process.CommandLine.IndexOf([string]$state.dllPath, [StringComparison]::OrdinalIgnoreCase) -lt 0) {
        throw 'The saved process ID now belongs to another application. It was not stopped.'
    }
    Stop-Process -Id ([int]$state.processId)
    Write-Host 'Tron City stopped. Your saved progress has been kept.'
} else { Write-Host 'Tron City is already stopped.' }
Remove-Item -LiteralPath $statePath
