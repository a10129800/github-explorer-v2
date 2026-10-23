@echo off
cd /d "%~dp0"
title GitHub Explorer V2 - Installer

where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1"
    goto END
)

:: Fallback if powershell is not found
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Running npm install...
call npm install
call npm run prisma:generate

echo [SUCCESS] Dependencies installed!
pause

:END
