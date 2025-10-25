# 🚀 Super Scanner - Development Shortcuts & Auto Updates

## 📱 Quick Development Options

### **Option 1: Batch Scripts (Easiest)**
- **`quick-build.bat`** - Builds frontend and syncs with Capacitor
- **`full-build.bat`** - Builds frontend, syncs, and creates APK
- **`live-reload-setup.bat`** - Sets up live reload development

### **Option 2: NPM Scripts (Professional)**
```bash
# Quick sync (build + sync)
npm run android:sync

# Full APK build
npm run android:build

# Live reload development
npm run android:live

# Development mode (dev server + live reload)
npm run android:dev
```

### **Option 3: Live Reload (Best for Development)**

#### Setup Live Reload:
1. **Run:** `live-reload-setup.bat`
2. **Install APK** on your phone (only once)
3. **Start dev server:** `npm run dev`
4. **Any changes** will instantly appear in the app!

#### Live Reload Benefits:
- ✅ **Instant Updates** - Changes appear immediately
- ✅ **No Rebuilding** - No need to rebuild APK
- ✅ **Hot Reload** - Preserves app state
- ✅ **Fast Development** - See changes in seconds

## 🔄 Development Workflow

### **For Small Changes (CSS, Text, etc.):**
```bash
# Option 1: Use batch script
quick-build.bat

# Option 2: Use npm script
npm run android:sync
```

### **For Major Changes (New Features, etc.):**
```bash
# Option 1: Use batch script
full-build.bat

# Option 2: Use npm script
npm run android:build
```

### **For Active Development:**
```bash
# Start live reload
npm run android:live
# OR
npm run android:dev
```

## 📲 Auto Update Solutions

### **1. Live Reload (Recommended)**
- Changes appear instantly
- No APK rebuilding needed
- Perfect for development

### **2. Over-the-Air Updates (Production)**
- Use Capacitor Live Updates plugin
- Push updates without app store
- Users get updates automatically

### **3. Progressive Web App (PWA)**
- Users can install from browser
- Updates automatically
- No APK needed

## 🎯 Quick Commands Summary

| Task | Command | Description |
|------|---------|-------------|
| Quick Build | `quick-build.bat` | Build + Sync |
| Full Build | `full-build.bat` | Build + Sync + APK |
| Live Setup | `live-reload-setup.bat` | Setup live reload |
| NPM Sync | `npm run android:sync` | Build + Sync |
| NPM Build | `npm run android:build` | Full APK build |
| Live Reload | `npm run android:live` | Start live reload |

## 💡 Pro Tips

1. **Use Live Reload** for active development
2. **Use Quick Build** for small changes
3. **Use Full Build** for testing/releases
4. **Keep dev server running** for instant updates
5. **Test on real device** for best experience
