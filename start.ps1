Set-Location $PSScriptRoot
if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..."
  npm install
}
Write-Host "Starting Quinsta at http://127.0.0.1:4317"
npm run dev
