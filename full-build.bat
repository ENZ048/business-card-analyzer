@echo off
echo 🚀 Super Scanner - Full Development Script
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
echo 🏗️ Building APK...
cd /d D:\Scanner\frontend\android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ❌ APK build failed!
    pause
    exit /b 1
)

echo.
echo ✅ APK built successfully!
echo 📱 APK Location: D:\Scanner\frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 📲 To install:
echo 1. Copy APK to your phone
echo 2. Enable "Unknown Sources" in Android settings
echo 3. Tap the APK to install
echo.
pause
