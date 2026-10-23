@echo off
cd /d "%~dp0"
title GitHub Explorer V2 - Generate App Icons

where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\generate_icons.ps1"
    goto END
)

echo [ERROR] PowerShell is required to generate the multi-resolution icons.
pause

:END
