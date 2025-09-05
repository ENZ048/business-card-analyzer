# API Configuration Guide

This guide explains how to change the backend URL for your Business Card Analyzer frontend.

## Quick Setup

### Method 1: Environment Variable (Recommended)
Create a `.env.local` file in your project root and add:
```bash
VITE_API_BASE_URL=http://your-backend-url:port
```

### Method 2: Configuration File
Edit `src/config/api.js` and change the `BASE_URL`:
```javascript
export const API_CONFIG = {
  BASE_URL: 'http://your-backend-url:port',
  // ... other config
};
```

## Examples

### Development
```bash
VITE_API_BASE_URL=http://localhost:5000
```

### Production
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Different Port
```bash
VITE_API_BASE_URL=http://localhost:3001
```

## How It Works

1. The system first checks for the `VITE_API_BASE_URL` environment variable
2. If not found, it falls back to the configuration in `src/config/api.js`
3. All API calls are now centralized through `src/lib/api.js`

## Files Modified

- `src/lib/api.js` - Centralized API service with axios
- `src/config/api.js` - Configuration file for API settings
- `src/components/BusinessCardApp.jsx` - Updated to use centralized API calls

## Benefits

- ✅ Single place to change backend URL
- ✅ Better error handling with axios interceptors
- ✅ Request/response logging
- ✅ Timeout configuration
- ✅ Consistent API interface
- ✅ Easy to add new endpoints

## Testing

After changing the URL, restart your development server:
```bash
npm run dev
```

The application will now use your new backend URL for all API calls.
