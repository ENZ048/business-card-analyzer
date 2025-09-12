# SuperScan WordPress Integration Deployment Guide

## Prerequisites
- WordPress site running at https://superscanai.com/
- Backend API deployed and accessible
- React app built with `/login/` base path

## Step 1: Install Dependencies
```bash
cd frontend
npm install
```

## Step 2: Configure Environment
1. Copy `production.env` to `.env.production`
2. Update the API URL in `.env.production`:
   ```
   VITE_API_BASE_URL=https://your-backend-api-url.com
   ```

## Step 3: Build the React App
```bash
# Option 1: Using the new script
npm run build:login

# Option 2: Using the command directly
npm run build -- --base=/login/
```

## Step 4: Deploy to WordPress
1. Upload the contents of `frontend/dist/` to `superscanai.com/login/`
2. Your file structure should look like:
   ```
   superscanai.com/
   ├── index.php (WordPress)
   ├── wp-content/ (WordPress)
   ├── login/ (Your React app)
   │   ├── index.html
   │   ├── assets/
   │   │   ├── index-[hash].js
   │   │   └── index-[hash].css
   │   └── ...
   ```

## Step 5: Update WordPress Configuration
1. Add the `.htaccess` rules from `wordpress-integration/.htaccess` to your WordPress `.htaccess` file
2. Update your login button to point to `https://superscanai.com/login/`

## Step 6: Update Backend CORS
Make sure your backend allows requests from:
- https://superscanai.com
- https://www.superscanai.com

## Step 7: Test the Integration
1. Visit https://superscanai.com/
2. Click the login button
3. Verify you're redirected to https://superscanai.com/login/
4. Test the React app functionality

## Troubleshooting
- If assets don't load, check that the base path is correctly set to `/login/`
- If API calls fail, verify CORS configuration in backend
- If routing doesn't work, ensure `.htaccess` rules are properly configured

## File Structure After Deployment
```
superscanai.com/
├── index.php (WordPress)
├── wp-content/ (WordPress)
├── .htaccess (Updated with React routing rules)
├── login/ (React app)
│   ├── index.html
│   ├── assets/
│   │   ├── index-[hash].js
│   │   └── index-[hash].css
│   └── ...
└── ...
```
