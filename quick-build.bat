@echo off
echo 🚀 Super Scanner - Quick Development Script
echo ==========================================

echo.
echo 📱 Building frontend...
cd /d D:\Scanner\frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed!
    pause
    exit /b 1
)

echo.
echo 🔄 Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo ✅ Frontend build and sync completed!
echo.
echo 📱 Next steps:
echo 1. Open Android Studio
echo 2. Build → Build Bundle(s) / APK(s) → Build APK(s)
echo 3. Install the new APK
echo.
pause
