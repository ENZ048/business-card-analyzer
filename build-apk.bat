@echo off
echo.
echo =====================================
echo    🚀 Super Scanner APK Build 🚀
echo =====================================
echo.

:: Define paths
set "FRONTEND_DIR=D:\Scanner\frontend"
set "ANDROID_DIR=%FRONTEND_DIR%\android"

echo [1/3] Building frontend (Vite)...
cd "%FRONTEND_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed.
    goto :eof
)
echo ✅ Frontend build complete.
echo.

echo [2/3] Syncing Capacitor with Android project...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed.
    goto :eof
)
echo ✅ Capacitor sync complete.
echo.

echo [3/3] Opening Android Studio for APK build...
echo.
echo 📱 APK Build Instructions:
echo =========================
echo 1. Android Studio should open automatically
echo 2. If not, manually open: %ANDROID_DIR%
echo 3. Wait for Gradle sync to complete
echo 4. Go to: Build → Build Bundle(s) / APK(s) → Build APK(s)
echo 5. Wait for build to complete
echo 6. APK will be created at:
echo    %ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 🎯 New Features Included:
echo - WhatsApp OTP Authentication
echo - Admin "New User Detail" Tab
echo - Enhanced User Management
echo - Mobile Responsive Design
echo.

:: Try to open Android Studio
start "" "%ANDROID_DIR%"

echo =====================================
echo    🎉 Ready for APK Build! 🎉
echo =====================================
pause
