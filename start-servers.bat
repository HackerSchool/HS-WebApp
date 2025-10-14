@echo off
REM Hacker League - Start Both Servers Script (Windows)
REM This script starts both the backend and frontend servers

echo 🚀 Starting Hacker League Admin System...
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version
echo ✅ npm version: 
npm --version
echo.

REM Check if ports are already in use
echo 🔍 Checking if ports are available...
netstat -ano | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 5000 is already in use. Backend may already be running.
    echo.
) else (
    echo ✅ Port 5000 is available
)

netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 3000 is already in use. Frontend may already be running.
    echo.
) else (
    echo ✅ Port 3000 is available
)

echo.
echo 🔧 Starting Backend Server...
cd backend

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
)

echo 🚀 Starting backend server on port 5000...
start "Hacker League - Backend (Port 5000)" cmd /k "npm start"

cd ..

echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo 🔍 Checking backend health...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running and healthy!
) else (
    echo ⚠️  Backend may still be starting... Check the Backend window for details.
)

echo.
echo 🎨 Starting Frontend Server...

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

echo 🚀 Starting frontend server on port 3000...
start "Hacker League - Frontend (Port 3000)" cmd /k "npm start"

echo ⏳ Waiting for frontend to initialize...
timeout /t 8 /nobreak >nul

echo.
echo 🔍 Performing health checks...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy - http://localhost:5000
) else (
    echo ❌ Backend health check failed
)

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy - http://localhost:3000
) else (
    echo ⚠️  Frontend may still be starting (React apps take 10-15 seconds)
)

echo.
echo 🎉 Servers Started!
echo ==============================
echo 📡 Backend API: http://localhost:5000
echo    Health Check: http://localhost:5000/api/health
echo 🌐 Frontend: http://localhost:3000
echo 🔌 WebSocket: ws://localhost:5000
echo.
echo 📋 Check the separate windows for detailed logs:
echo    - "Hacker League - Backend (Port 5000)"
echo    - "Hacker League - Frontend (Port 3000)"
echo.
echo 💡 Tips:
echo    - If you see errors, check the server windows
echo    - Frontend may take 10-15 seconds to fully load
echo    - Visit http://localhost:3000 in your browser
echo.
echo Close the server windows or press Ctrl+C in them to stop the servers.
echo.
pause
