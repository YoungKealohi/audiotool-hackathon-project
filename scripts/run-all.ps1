# Windows optional: start Backend, Frontend, and MCP Server in new windows.
# Requires an activated conda env (e.g. conda activate NexusAgent) so CONDA_PREFIX is set.
#
# From repo root:
#   .\scripts\run-all.ps1
#
# Builds MCP (npm run build), then launches backend, frontend, and MCP in separate processes.
# For cross-platform or debugging, use README "Run" with three terminals instead.

$ErrorActionPreference = "Stop"
$projectRoot = if ($PSScriptRoot) { (Resolve-Path (Join-Path $PSScriptRoot "..")).Path } else { Get-Location }

if (-not $env:CONDA_PREFIX) {
    Write-Error "Activate the NexusAgent conda environment first (e.g. conda activate NexusAgent) so CONDA_PREFIX is set."
    exit 1
}

$envRoot = $env:CONDA_PREFIX
$python = Join-Path $envRoot "python.exe"
$npm = Join-Path $envRoot "npm.cmd"

if (-not (Test-Path $python)) {
    Write-Error "python.exe not found at $python — check your conda env."
    exit 1
}
if (-not (Test-Path $npm)) {
    Write-Error "npm.cmd not found at $npm — ensure Node is installed in this conda env."
    exit 1
}

# Add env to PATH so npm/tsc can find node (required when run with -NoProfile)
$env:PATH = "$envRoot;$envRoot\Scripts;$env:PATH"
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"
$mcpDir = Join-Path $projectRoot "mcp-server"

Write-Host "Building MCP Server..."
Push-Location $mcpDir
try {
    & $npm run build
} finally {
    Pop-Location
}

Write-Host "Starting Backend, Frontend, and MCP Server in new windows..."
Start-Process -FilePath $python -ArgumentList "main.py" -WorkingDirectory $backendDir -WindowStyle Normal
Start-Process -FilePath $npm -ArgumentList "run", "dev" -WorkingDirectory $frontendDir -WindowStyle Normal
Start-Process -FilePath $npm -ArgumentList "run", "start" -WorkingDirectory $mcpDir -WindowStyle Normal

Write-Host "All three services started (Backend, Frontend, MCP Server). Close their windows to stop."
