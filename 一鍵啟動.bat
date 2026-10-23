@echo off
cd /d "%~dp0"
title GitHub Explorer V2 - Launcher

where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1"
    goto END
)

:: Fallback if powershell is somehow not found
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    call npm run prisma:generate
)

echo Starting Next.js server at http://localhost:3000 ...
call npm run dev
pause

:END
