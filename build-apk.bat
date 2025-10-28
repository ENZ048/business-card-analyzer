@echo off

:: Create log file
set "LOG_FILE=%~dp0build-log.txt"
echo Build started at %date% %time% > "%LOG_FILE%"

echo.
echo =====================================
echo    🚀 Super Scanner APK Build 🚀
echo =====================================
echo.
echo Logging to: %LOG_FILE%
echo.

:: Define paths
set "FRONTEND_DIR=D:\neww\business-card-analyzer\frontend"
set "ANDROID_DIR=D:\neww\business-card-analyzer\frontend\android"

echo [1/4] Building frontend (Vite)...
echo [1/4] Building frontend (Vite)... >> "%LOG_FILE%" 2>&1
cd "%FRONTEND_DIR%"
if not exist "%FRONTEND_DIR%" (
    echo ❌ Frontend directory not found: %FRONTEND_DIR%
    echo ❌ Frontend directory not found: %FRONTEND_DIR% >> "%LOG_FILE%"
    pause
    goto :eof
)
call npm run build >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed. Check %LOG_FILE% for details.
    echo ❌ Frontend build failed >> "%LOG_FILE%"
    pause
    goto :eof
)
echo ✅ Frontend build complete.
echo.

echo [2/4] Syncing Capacitor with Android project...
echo [2/4] Syncing Capacitor with Android project... >> "%LOG_FILE%" 2>&1
call npx cap sync android >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed. Check %LOG_FILE% for details.
    echo ❌ Capacitor sync failed >> "%LOG_FILE%"
    pause
    goto :eof
)
echo ✅ Capacitor sync complete.
echo.

echo [3/4] Building Android APK (Debug)...
echo [3/4] Building Android APK (Debug)... >> "%LOG_FILE%" 2>&1
cd "%ANDROID_DIR%"
if not exist "%ANDROID_DIR%" (
    echo ❌ Android directory not found: %ANDROID_DIR%
    echo ❌ Android directory not found: %ANDROID_DIR% >> "%LOG_FILE%"
    pause
    goto :eof
)
call gradlew assembleDebug >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Android APK build failed. Check %LOG_FILE% for details.
    echo ❌ Android APK build failed >> "%LOG_FILE%"
    echo.
    echo 💡 Try opening Android Studio manually:
    echo    1. Open Android Studio
    echo    2. Open project: %ANDROID_DIR%
    echo    3. Build → Build Bundle(s) / APK(s) → Build APK(s)
    pause
    goto :eof
)
echo ✅ Android APK build complete.
echo.

echo [4/4] APK Location:
echo The debug APK can be found at:
echo "%FRONTEND_DIR%\android\app\build\outputs\apk\debug\app-debug.apk"
echo.
echo Build completed successfully at %date% %time% >> "%LOG_FILE%"
echo =====================================
echo    🎉 APK Build Process Finished! 🎉
echo =====================================
echo.
echo Log file saved at: %LOG_FILE%
pause