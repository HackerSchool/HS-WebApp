@echo off
REM Quick Server Health Check Script

echo 🔍 Testing Hacker League Servers...
echo ===================================
echo.

echo Testing Backend (Port 5000)...
curl -s http://localhost:5000/api/health
if %errorlevel% equ 0 (
    echo ✅ Backend is responding
) else (
    echo ❌ Backend is NOT responding
)

echo.
echo Testing Frontend (Port 3000)...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:3000
if %errorlevel% equ 0 (
    echo ✅ Frontend is responding
) else (
    echo ❌ Frontend is NOT responding
)

echo.
echo 📊 Port Status:
echo Backend (5000):
netstat -ano | findstr ":5000" | findstr "LISTENING"
echo.
echo Frontend (3000):
netstat -ano | findstr ":3000" | findstr "LISTENING"

echo.
pause

