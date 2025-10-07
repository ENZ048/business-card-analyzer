# Demo User Session-Based Limits

## Overview

Demo users have a **session-based limit of 5 card scans**. This means they can scan up to 5 business cards per login session. Once they use all 5 scans, they must either:
1. **Log out and log back in** to get 5 new scans, OR
2. **Upgrade to a paid plan** for unlimited scans

## How It Works

### Backend Implementation

#### 1. **Login (userController.js)**
When a demo user logs in:
- The system detects if `user.isDemo === true`
- Generates a JWT token with `sessionScans: 5`
- Returns the token and user info with `sessionScans` property

```javascript
if (user.isDemo) {
  sessionScans = 5;
  token = generateToken(user._id, sessionScans);
}
```

#### 2. **Authentication Middleware (authMiddleware.js)**
On every API request:
- Extracts `sessionScans` from the JWT token
- Attaches it to `req.user.sessionScans` for use in controllers

```javascript
if (user.isDemo && decoded.sessionScans !== undefined) {
  req.user.sessionScans = decoded.sessionScans;
}
```

#### 3. **OCR Processing (ocrController.js)**
When processing business cards:
- Checks if user has enough session scans remaining
- Decrements `sessionScans` by the number of cards scanned
- Generates a **new JWT token** with updated `sessionScans`
- Returns the new token in the response

```javascript
if (isDemo) {
  // Validate and decrement session scans
  sessionScans -= actualScanCount;
  
  // Generate new JWT with updated sessionScans
  const newToken = jwt.sign(
    { userId: userId, sessionScans: sessionScans },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  response.token = newToken; // Return new token
}
```

### Frontend Implementation

#### 1. **Usage Tracking (BusinessCardApp.jsx)**
- Fetches usage data on mount and displays remaining scans
- Shows "(this session)" label for demo users
- Warns users before they select more images than they have scans

```javascript
const isDemo = data.isDemo || user?.isDemo || false;
const sessionScans = data.sessionScans || user?.sessionScans || 0;

setUsageData({
  scansRemaining: isDemo ? sessionScans : (data.planLimit - data.thisMonth),
  isDemo: isDemo,
  sessionScans: sessionScans
});
```

#### 2. **Token Update After Scan**
After each successful scan:
- Receives the new token from backend response
- Updates `localStorage` with the new token
- Updates local state to reflect remaining scans

```javascript
if (result.usage && result.usage.isDemo) {
  // Update local state
  setUsageData(prev => ({
    ...prev,
    scansRemaining: result.usage.sessionScans,
    sessionScans: result.usage.sessionScans
  }));
  
  // Update token in localStorage
  if (result.token) {
    localStorage.setItem('token', result.token);
  }
}
```

## User Experience

### Before Scanning
```
┌─────────────────────────────────────┐
│  Upload Business Card               │
│                                     │
│  🎫 5 scans remaining (this session) │
└─────────────────────────────────────┘
```

### After Scanning 3 Cards
```
┌─────────────────────────────────────┐
│  Upload Business Card               │
│                                     │
│  🎫 2 scans remaining (this session) │
└─────────────────────────────────────┘
```

### After Using All 5 Scans
```
┌─────────────────────────────────────┐
│  Upload Business Card               │
│                                     │
│  🎫 0 scans remaining (this session) │
│                                     │
│  ⚠️ You have used all your demo     │
│     scans for this session.         │
│                                     │
│  [Log Out & Log In Again]           │
│  [Upgrade to Paid Plan]             │
└─────────────────────────────────────┘
```

## Error Messages

### Attempting to Scan Without Scans
```
You have used all your demo scans for this session.
Please log in again to get 5 new scans.
```

### Attempting to Scan More Than Remaining
```
You only have 2 demo scan(s) remaining in this session.
You are trying to scan 5 cards.
```

### Session Expired
```
Demo session has expired.
Please log in again to get 5 new scans.
```

## Benefits of Session-Based Limits

1. **No Database Writes**: Scans are not stored in the database for demo users
2. **Fresh Start**: Each login gives a fresh set of 5 scans
3. **Persistent During Session**: Even if the user refreshes the page, their remaining scans persist (via JWT in localStorage)
4. **Easy to Manage**: No need to track usage across time periods
5. **Encourages Upgrades**: Promotes paid plans for unlimited scanning

## Technical Details

### JWT Token Structure
```json
{
  "userId": "68e4a31e5ddc1d7b2ed5b5cf",
  "sessionScans": 5,
  "iat": 1706000000,
  "exp": 1706604800
}
```

### Database Model
Demo users are identified by the `isDemo` boolean flag in the User model:

```javascript
{
  _id: ObjectId,
  email: String,
  firstName: String,
  lastName: String,
  isDemo: true,  // ← Demo user flag
  // ... other fields
}
```

### Setting a User as Demo
Use the provided script:

```bash
node backend/scripts/setDemoUser.js <userId>
```

Or manually update in MongoDB:

```javascript
db.users.updateOne(
  { _id: ObjectId("userId") },
  { $set: { isDemo: true } }
)
```

## Testing Demo Functionality

1. **Create a Demo User**:
   ```bash
   node backend/scripts/setDemoUser.js <userId>
   ```

2. **Log In**: Demo user logs in and receives token with `sessionScans: 5`

3. **Scan Cards**: Upload and process cards
   - Watch the scan count decrease
   - Verify new token is returned
   - Check localStorage for updated token

4. **Exhaust Scans**: Use all 5 scans
   - Try to scan more (should be blocked)
   - Verify error message

5. **Refresh Page**: Refresh the browser
   - Verify remaining scans persist (JWT in localStorage)

6. **Log Out & Log In**: Log out and log back in
   - Verify scans reset to 5

## Monitoring

Check console logs for demo user activity:

```
🔍 LOGIN - User isDemo: true | Email: demo@example.com
✅ DEMO USER LOGIN - Generated token with sessionScans: 5

🔐 AUTH MIDDLEWARE - Demo user authenticated
   User ID: 68e4a31e5ddc1d7b2ed5b5cf
   Email: demo@example.com
   JWT sessionScans: 5
   Attached to req.user.sessionScans: 5
```

## Regular Users vs Demo Users

| Feature | Regular Users | Demo Users |
|---------|--------------|------------|
| **Limit Type** | Monthly (database) | Session (JWT) |
| **Reset** | Monthly | Every login |
| **Storage** | Usage collection | JWT token only |
| **Upgradable** | Yes (via plans) | Yes (becomes regular) |
| **Scans** | Based on plan | 5 per session |

## Upgrading Demo Users

When a demo user upgrades:
1. Set `isDemo: false`
2. Assign a paid plan
3. Set plan dates
4. On next login, they'll get a regular JWT (without `sessionScans`)
5. Usage tracking switches to database-based system

```javascript
// Remove demo status
user.isDemo = false;
user.currentPlan = paidPlanId;
user.planStartDate = new Date();
user.planEndDate = calculatePlanEndDate();
await user.save();
```

