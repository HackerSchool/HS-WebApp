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

echo 🔧 Starting Backend Server...
cd backend

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    npm install
)

echo 🚀 Starting backend server on port 5000...
start "Backend Server" cmd /k "npm start"

cd ..

echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo 🎨 Starting Frontend Server...

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)

echo 🚀 Starting frontend server on port 3000...
start "Frontend Server" cmd /k "npm start"

echo.
echo 🎉 Both servers are starting!
echo ==============================
echo 📡 Backend API: http://localhost:5000
echo 🌐 Frontend: http://localhost:3000
echo 🔌 WebSocket: ws://localhost:5000
echo.
echo Both servers are running in separate windows.
echo Close the windows to stop the servers.
echo.
pause
