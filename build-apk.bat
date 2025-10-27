@echo off
echo.
echo =====================================
echo    🚀 Super Scanner APK Build 🚀
echo =====================================
echo.

:: Define paths
set "FRONTEND_DIR=D:\Scanner\frontend"
set "ANDROID_DIR=D:\Scanner\frontend\android"

echo [1/4] Building frontend (Vite)...
cd "%FRONTEND_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed.
    goto :eof
)
echo ✅ Frontend build complete.
echo.

echo [2/4] Syncing Capacitor with Android project...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed.
    goto :eof
)
echo ✅ Capacitor sync complete.
echo.

echo [3/4] Building Android APK (Debug)...
cd "%ANDROID_DIR%"
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ❌ Android APK build failed.
    echo.
    echo 💡 Try opening Android Studio manually:
    echo    1. Open Android Studio
    echo    2. Open project: %ANDROID_DIR%
    echo    3. Build → Build Bundle(s) / APK(s) → Build APK(s)
    goto :eof
)
echo ✅ Android APK build complete.
echo.

echo [4/4] APK Location:
echo The debug APK can be found at:
echo "%FRONTEND_DIR%\android\app\build\outputs\apk\debug\app-debug.apk"
echo.
echo =====================================
echo    🎉 APK Build Process Finished! 🎉
echo =====================================
pause