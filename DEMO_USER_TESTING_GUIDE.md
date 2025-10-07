# Demo User Testing Guide

## Quick Test Steps

### 1. Create a Demo User

**Option A: Use existing user**
```bash
cd backend
node scripts/setDemoUser.js <your-user-id>
```

**Option B: Check if demo user exists**
```bash
# In MongoDB Compass or shell
db.users.findOne({ isDemo: true })
```

### 2. Test Login

1. **Log in with demo user credentials**
2. **Check browser console** for login logs:
   ```
   🔍 LOGIN - User isDemo: true | Email: demo@example.com
   ✅ DEMO USER LOGIN - Generated token with sessionScans: 5
   ```
3. **Check UI**: Should show "5 scans remaining (this session)"

### 3. Test Single Card Scan

1. **Navigate to Dashboard**
2. **Select "Single Card" mode**
3. **Upload a business card image**
4. **Click "Process Card"**
5. **Verify**:
   - Card processes successfully
   - Scans remaining decreases to 4
   - Browser localStorage has updated token
   - No page refresh loses the count

### 4. Test Bulk Upload

1. **Switch to "Bulk Upload" mode**
2. **Upload 3 business card images**
3. **Click "Process 3 Cards"**
4. **Verify**:
   - All cards process successfully
   - Scans remaining decreases to 1 (4 - 3 = 1)
   - UI shows "1 scan remaining (this session)"

### 5. Test Limit Enforcement

1. **Try to upload 2 more images** (you only have 1 remaining)
2. **Verify error message**:
   ```
   You only have 1 scan(s) remaining.
   You selected 2 images.
   Please log in again to get 5 new demo scans or upgrade to a paid plan.
   ```

### 6. Test Exhausting Scans

1. **Upload and process 1 more card**
2. **Verify**:
   - Scans remaining = 0
   - UI shows "0 scans remaining (this session)"
3. **Try to upload another card**
4. **Verify error**:
   ```
   You have used all your demo scans for this session.
   Please log in again to get 5 new scans.
   ```

### 7. Test Page Refresh

1. **With remaining scans < 5**, refresh the page (F5)
2. **Verify**:
   - Scan count persists (e.g., still shows 2 remaining)
   - No reset to 5
   - User stays logged in

### 8. Test Session Reset

1. **Log out**
2. **Log back in**
3. **Verify**:
   - Scans reset to 5
   - UI shows "5 scans remaining (this session)"
   - Fresh JWT token in localStorage

### 9. Test Backend Logs

Check backend console for proper logging:

```bash
# Backend should log:
🔍 LOGIN - User isDemo: true | Email: demo@example.com
✅ DEMO USER LOGIN - Generated token with sessionScans: 5

🔐 AUTH MIDDLEWARE - Demo user authenticated
   User ID: 68e4a31e5ddc1d7b2ed5b5cf
   Email: demo@example.com
   JWT sessionScans: 5
   Attached to req.user.sessionScans: 5
```

### 10. Test JWT Token Structure

Open browser DevTools → Console:

```javascript
// Get the token
const token = localStorage.getItem('token');

// Decode it (simple base64 decode of middle part)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);

// Should show:
// {
//   userId: "68e4a31e5ddc1d7b2ed5b5cf",
//   sessionScans: 5,  // ← This value decreases with each scan
//   iat: 1706000000,
//   exp: 1706604800
// }
```

## Expected UI Behavior

### Dashboard Card Counter
```
┌──────────────────────────────────────┐
│ Upload Business Card                 │
│                                      │
│ 🎫 5 scans remaining (this session) │
└──────────────────────────────────────┘
```

### After 2 Scans
```
┌──────────────────────────────────────┐
│ Upload Business Card                 │
│                                      │
│ 🎫 3 scans remaining (this session) │
└──────────────────────────────────────┘
```

### After All Scans Used
```
┌──────────────────────────────────────┐
│ Upload Business Card                 │
│                                      │
│ 🎫 0 scans remaining (this session) │
└──────────────────────────────────────┘

❌ You have used all your demo scans for this session.
   Please log in again to get 5 new scans.
```

## API Response Verification

### Single Card Scan Response
```json
{
  "success": true,
  "message": "Processing completed successfully",
  "mode": "single",
  "data": [...],
  "summary": {...},
  "usage": {
    "sessionScans": 4,           // ← Remaining scans
    "scansThisRequest": 1,       // ← Scans used in this request
    "isDemo": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // ← New JWT token
}
```

### Bulk Upload Response (3 cards)
```json
{
  "success": true,
  "message": "Processing completed successfully",
  "mode": "bulk",
  "data": [...],
  "summary": {...},
  "usage": {
    "sessionScans": 2,           // ← Started with 5, now 2 remaining
    "scansThisRequest": 3,       // ← Used 3 scans
    "isDemo": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // ← New JWT token
}
```

## Troubleshooting

### Problem: Scans reset to 5 on page refresh
**Cause**: Backend not returning new token, or frontend not storing it

**Solution**:
1. Check network response includes `token` field
2. Verify frontend updates localStorage: `localStorage.setItem('token', result.token)`

### Problem: User can scan more than 5 cards
**Cause**: User not properly marked as demo

**Solution**:
```bash
# Check user in database
db.users.findOne({ email: "demo@example.com" })

# Ensure isDemo is true
db.users.updateOne(
  { email: "demo@example.com" },
  { $set: { isDemo: true } }
)
```

### Problem: "Demo session has expired" error
**Cause**: JWT doesn't contain `sessionScans` property

**Solution**: Log out and log back in to get a fresh JWT token with `sessionScans`

### Problem: Backend not logging demo user info
**Cause**: Console logs might be disabled or redirected

**Solution**: Check `backend/logs/` folder for log files

## Database Verification

Demo users should NOT have entries in the `usages` collection:

```javascript
// Regular user (has usage records)
db.usages.find({ user: ObjectId("regular-user-id") })
// → Returns usage documents

// Demo user (no usage records)
db.usages.find({ user: ObjectId("demo-user-id") })
// → Returns empty array []
```

## Performance Notes

- ✅ **No database writes** for demo scans
- ✅ **Stateless** (everything in JWT)
- ✅ **Fast** (no database queries for usage)
- ✅ **Scalable** (no usage tracking overhead)

## Comparison Test

Test the same user as regular vs demo:

### As Regular User
1. Scans are tracked in database (`usages` collection)
2. Monthly limits apply
3. JWT has only `userId`, no `sessionScans`
4. Usage persists across sessions

### As Demo User
1. No database tracking
2. Session limits apply (5 scans)
3. JWT has both `userId` and `sessionScans`
4. Usage resets every login

## Success Criteria

✅ Demo user can scan up to 5 cards per session
✅ Scan count decreases with each scan
✅ Scan count persists on page refresh
✅ Scan count resets on re-login
✅ Appropriate error messages when limit exceeded
✅ UI shows "(this session)" indicator
✅ JWT token updates with each scan
✅ No database usage records for demo users
✅ Backend logs show demo user activity
✅ Regular users unaffected

## Test Checklist

- [ ] Created/identified demo user
- [ ] Logged in successfully with sessionScans: 5
- [ ] Processed single card (scans: 5 → 4)
- [ ] Processed bulk cards (scans: 4 → 1)
- [ ] Hit limit warning
- [ ] Exhausted all scans
- [ ] Got proper error message
- [ ] Refreshed page (scans persisted)
- [ ] Logged out and back in (scans reset to 5)
- [ ] Verified JWT token updates
- [ ] Checked backend logs
- [ ] Verified no usage records in database
- [ ] Tested with regular user (works normally)

