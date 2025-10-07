# Fix Demo User Session Limits - Step by Step

## Problem
Your demo user (bd@troikatech.net) is not showing session-based limits because they might have a regular plan assigned.

## Solution - Follow These Steps

### Step 1: Set the User as Demo

```bash
cd backend
node scripts/setupDemoUser.js
```

**Expected Output:**
```
✅ Connected to MongoDB

📋 Current User Details:
- Email: bd@troikatech.net
- Name: Demo User
- Company: Troika
- Phone: 9373521595
- isDemo: false  ← Will change to true
- currentPlan: [Some Plan ID or null]
- planStartDate: [Some date or null]
- planEndDate: [Some date or null]

✅ User updated to demo user successfully!

📧 Demo User Credentials:
Email: bd@troikatech.net
ID: 68e4a31e5ddc1d7b2ed5b5cf

🎯 Demo User Features:
- Gets 5 scans per login session
- Scans reset on each login
- No database usage tracking
- Session-based limits via JWT
```

### Step 2: Verify the JWT Token

```bash
node scripts/checkDemoUserToken.js
```

**Expected Output:**
```
✅ Connected to MongoDB

📋 User Details:
- Email: bd@troikatech.net
- Name: Demo User
- isDemo: true  ← Should be true now
- currentPlan: [Plan name or None]
- planEndDate: [Date or null]

🔑 Fresh Demo JWT Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

📦 Token Payload:
{
  "userId": "68e4a31e5ddc1d7b2ed5b5cf",
  "sessionScans": 5,  ← This must be present!
  "iat": 1706000000,
  "exp": 1706604800
}

✅ Verification:
- Has userId: ✓
- Has sessionScans: ✓
- sessionScans value: 5
```

### Step 3: Test in the Browser

1. **Log out** from the application (if logged in)

2. **Clear browser storage** (optional but recommended):
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Local Storage

3. **Log in** with demo user:
   - Email: `bd@troikatech.net`
   - Password: [your password]

4. **Check Backend Console** - You should see:
   ```
   🔍 LOGIN - User isDemo: true | Email: bd@troikatech.net
   ✅ DEMO USER LOGIN - Generated token with sessionScans: 5
   ```

5. **Check Frontend UI** - You should see:
   ```
   🎫 5 scans remaining (this session)
   ```
   Note the "(this session)" text - this confirms it's working!

### Step 4: Verify JWT Token in Browser

Open browser DevTools → Console, and run:

```javascript
// Get the token
const token = localStorage.getItem('token');

// Decode it
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token Payload:', payload);

// Check for sessionScans
console.log('Has sessionScans:', payload.sessionScans !== undefined);
console.log('sessionScans value:', payload.sessionScans);
```

**Expected Output:**
```javascript
Token Payload: {
  userId: "68e4a31e5ddc1d7b2ed5b5cf",
  sessionScans: 5,  // ← THIS MUST BE HERE!
  iat: 1706000000,
  exp: 1706604800
}
Has sessionScans: true
sessionScans value: 5
```

### Step 5: Test Scanning

1. **Upload a business card**
2. **Click "Process Card"**
3. **Watch the scan count**:
   - Should change from 5 → 4
   - UI should still show "(this session)"

4. **Check Backend Logs**:
   ```
   🔐 AUTH MIDDLEWARE - Demo user authenticated
      User ID: 68e4a31e5ddc1d7b2ed5b5cf
      Email: bd@troikatech.net
      JWT sessionScans: 5
      Attached to req.user.sessionScans: 5
   ```

5. **Check Response** in Network tab:
   - Look for the API response
   - Should contain:
     ```json
     {
       "usage": {
         "sessionScans": 4,
         "scansThisRequest": 1,
         "isDemo": true
       },
       "token": "eyJhbGc..."  // New token with sessionScans: 4
     }
     ```

### Step 6: Test Page Refresh

1. **Refresh the page** (F5)
2. **Check that scan count persists** (should still be 4)
3. **Should NOT reset to 5**

### Step 7: Test Session Reset

1. **Log out**
2. **Log back in**
3. **Scans should reset to 5**
4. **UI shows "5 scans remaining (this session)"**

## Troubleshooting

### Issue: "isDemo: false" after running setupDemoUser.js

**Solution:**
```bash
# Manually set in MongoDB
# Connect to your MongoDB and run:
db.users.updateOne(
  { _id: ObjectId("68e4a31e5ddc1d7b2ed5b5cf") },
  { $set: { isDemo: true } }
)
```

### Issue: UI doesn't show "(this session)"

**Possible Causes:**
1. User not properly logged out and back in
2. Old token still in localStorage
3. Backend not returning sessionScans in response

**Solution:**
1. Clear localStorage completely
2. Log out and log back in
3. Check backend logs for demo user detection

### Issue: Backend logs don't show "DEMO USER LOGIN"

**Cause:** The `isDemo` flag is not set in the database

**Solution:**
```bash
# Run the setup script again
node scripts/setupDemoUser.js

# Or manually check in MongoDB
db.users.findOne({ _id: ObjectId("68e4a31e5ddc1d7b2ed5b5cf") })
```

### Issue: Scans reset to 5 on page refresh

**Cause:** Backend not returning new token, or frontend not saving it

**Solution:**
1. Check Network tab for the OCR API response
2. Verify it includes a `token` field
3. Check that frontend is calling `localStorage.setItem('token', result.token)`

### Issue: JWT token doesn't have sessionScans

**Cause:** User logged in before being set as demo

**Solution:**
1. Log out completely
2. Run `node scripts/setupDemoUser.js`
3. Log back in (this generates a fresh token with sessionScans)

## Quick Verification Checklist

Run through this checklist to verify everything is working:

- [ ] Ran `node scripts/setupDemoUser.js` successfully
- [ ] Ran `node scripts/checkDemoUserToken.js` successfully
- [ ] Logged out and back in
- [ ] Backend logs show "DEMO USER LOGIN - Generated token with sessionScans: 5"
- [ ] UI shows "5 scans remaining (this session)" with "(this session)" text
- [ ] JWT token in localStorage has `sessionScans: 5`
- [ ] Uploaded a card and saw count decrease to 4
- [ ] Backend logs show demo user authentication with sessionScans
- [ ] API response includes new token with updated sessionScans
- [ ] Refreshed page and count stayed at 4 (didn't reset)
- [ ] Logged out and back in, count reset to 5

## Database Verification

Check the user in MongoDB:

```javascript
db.users.findOne({ 
  _id: ObjectId("68e4a31e5ddc1d7b2ed5b5cf") 
})

// Should return:
{
  _id: ObjectId("68e4a31e5ddc1d7b2ed5b5cf"),
  email: "bd@troikatech.net",
  firstName: "Demo",
  lastName: "User",
  companyName: "Troika",
  phoneNumber: "9373521595",
  isDemo: true,  // ← MUST BE TRUE!
  // ... other fields
}
```

## Expected Behavior

### Regular User vs Demo User Comparison

**Regular User (NOT demo):**
- JWT has only: `{ userId, iat, exp }`
- UI shows: "47 scans remaining" (no session text)
- Limits: Based on monthly plan
- Storage: Usage tracked in database

**Demo User (IS demo):**
- JWT has: `{ userId, sessionScans, iat, exp }`
- UI shows: "5 scans remaining (this session)"
- Limits: 5 per login session
- Storage: No database tracking (JWT only)

## Success Confirmation

You'll know it's working when:

1. ✅ Backend logs show demo user detection
2. ✅ UI clearly shows "(this session)" indicator
3. ✅ JWT token has `sessionScans` property
4. ✅ Scan count decreases with each scan
5. ✅ Scan count persists on page refresh
6. ✅ Scan count resets to 5 on re-login
7. ✅ Appropriate error messages when limit exceeded

## Need Help?

If still having issues:

1. Check backend console logs carefully
2. Check browser DevTools → Console for errors
3. Verify JWT token structure in browser
4. Check Network tab for API responses
5. Verify `isDemo: true` in MongoDB

## Contact

If you continue to experience issues, provide:
- Backend console logs
- Frontend console errors
- JWT token payload (from browser)
- User document from MongoDB
- Network response from OCR API

