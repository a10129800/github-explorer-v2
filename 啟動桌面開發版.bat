@echo off
cd /d "%~dp0"
title GitHub Explorer V2 - Desktop Dev Mode

where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_desktop_dev.ps1"
    goto END
)

echo [INFO] Starting Electron dev mode...
call npx electron .
pause

:END
