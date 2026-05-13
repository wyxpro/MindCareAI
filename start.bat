@echo off
title MindCareAI Startup Script
echo ==========================================
echo       MindCareAI - 智能心理检测与疗愈助手
echo ==========================================
echo.
echo [1/3] Checking environment...
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] pnpm is not installed. Please install pnpm first.
    pause
    exit /b
)

echo [2/3] Checking dependencies...
if not exist "node_modules" (
    echo node_modules not found. Installing dependencies...
    pnpm install
)

echo [3/3] Starting development server...
echo.
pnpm dev
pause
