@echo off
echo ╔════════════════════════════════════════════════════════╗
echo ║         RUN ALL TESTS - HAWASSA MESOB BACKEND         ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo 📝 Step 1: Checking if backend is running...
curl -s http://localhost:5000/api/health > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend is not running!
    echo.
    echo Please start the backend first:
    echo    cd backend
    echo    npm start
    echo.
    pause
    exit /b 1
)
echo ✅ Backend is running
echo.

echo 📝 Step 2: Clearing old queue entries...
node clear-queue-entries.js 2>nul
echo.

echo 📝 Step 3: Running Official Test Suite (55 tests)...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
node test-auth-rbac-complete.js
echo.

echo 📝 Step 4: Running Comprehensive Test Suite (28 tests)...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
node comprehensive-final-test.js
echo.

echo ╔════════════════════════════════════════════════════════╗
echo ║              ALL TESTS COMPLETED!                      ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Check the results above to verify all tests passed.
echo.
pause
