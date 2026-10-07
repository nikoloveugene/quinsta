@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
echo Starting Quinsta at http://127.0.0.1:4317
call npm run dev
pause
