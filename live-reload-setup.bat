@echo off
echo 🚀 Super Scanner - Live Reload Development
echo ==========================================

echo.
echo 📱 Starting live reload development...
echo.
echo 📋 Instructions:
echo 1. Make sure your phone and computer are on the same WiFi network
echo 2. Run this script
echo 3. Install the APK once (it will auto-update after that)
echo 4. Any changes you make will instantly appear in the app!
echo.

cd /d D:\Scanner\frontend

echo 🔄 Syncing with live reload...
call npx cap sync android

echo.
echo 🏗️ Building APK with live reload...
cd /d D:\Scanner\frontend\android
call gradlew assembleDebug

echo.
echo ✅ Live reload APK ready!
echo 📱 APK Location: D:\Scanner\frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 📲 Next steps:
echo 1. Install this APK on your phone (only needed once)
echo 2. Start the frontend dev server: npm run dev
echo 3. Any changes will instantly appear in the app!
echo.
pause
