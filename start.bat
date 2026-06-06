@echo off
cd /d "%~dp0"

echo ================================
echo MultiChat - Start Frontend + Backend
echo ================================
echo.

echo [1/2] Starting backend (Rust)...
start "MultiChat-Backend" cmd /c "cd /d "%~dp0server" && cargo run"

echo Waiting for backend build...
timeout /t 3 /nobreak > nul

echo [2/2] Starting frontend (Vite + React)...
start "MultiChat-Frontend" cmd /c "cd /d "%~dp0client" && npm install 2>nul && npm run dev"

echo.
echo Backend: http://127.0.0.1:3001
echo Frontend: http://localhost:5173
echo.
echo Close windows to stop services.
pause