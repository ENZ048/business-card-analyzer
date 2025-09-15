# SuperScan Deployment Guide

## Prerequisites
- Frontend deployed at https://login.superscanai.com/
- Backend API deployed at https://api.superscanai.com/
- WordPress site running at https://superscanai.com/ (optional)

## Step 1: Install Dependencies
```bash
cd frontend
npm install
```

## Step 2: Configure Environment
1. Copy `production.env` to `.env.production`
2. The API URL is already configured for production:
   ```
   VITE_API_BASE_URL=https://api.superscanai.com
   ```

## Step 3: Build the React App
```bash
# Build for production deployment
npm run build
```

## Step 4: Deploy to Frontend Server
1. Upload the contents of `frontend/dist/` to your frontend server at `login.superscanai.com`
2. Your file structure should look like:
   ```
   login.superscanai.com/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   └── index-[hash].css
   └── ...
   ```

## Step 5: Update Backend CORS
The backend is already configured to allow requests from:
- https://login.superscanai.com (your frontend)
- https://superscanai.com (WordPress root)
- https://www.superscanai.com

## Step 6: WordPress Integration (Optional)
If you want to integrate with WordPress:
1. Add the `.htaccess` rules from `wordpress-integration/.htaccess` to your WordPress `.htaccess` file
2. Update your login button to point to `https://login.superscanai.com/`

## Step 7: Test the Integration
1. Visit https://login.superscanai.com/
2. Test the React app functionality
3. Verify API calls are working to https://api.superscanai.com
4. Test user registration and login

## Troubleshooting
- If assets don't load, check your web server configuration
- If API calls fail, verify CORS configuration in backend allows `https://login.superscanai.com`
- If authentication fails, check JWT_SECRET and database connection
- Check browser console for any CORS or network errors

## File Structure After Deployment
```
login.superscanai.com/ (Frontend)
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...

api.superscanai.com/ (Backend)
├── server.js
├── routes/
├── controllers/
└── ...

superscanai.com/ (WordPress - Optional)
├── index.php
├── wp-content/
└── ...
```
