@echo off
cd /d "%~dp0"
title GitHub Explorer V2 - Build Windows Installer (.exe)

where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build_installer.ps1"
    goto END
)

echo [ERROR] PowerShell is required to run the automated packaging script!
pause

:END
