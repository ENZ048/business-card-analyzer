# Demo User Session Limits - Quick Start

## 🎯 What You Asked For

✅ **Demo users now have a session-based limit of 5 cards**

## 🚀 Quick Setup (2 Steps)

### Step 1: Mark a User as Demo

```bash
cd backend
node scripts/setDemoUser.js <user-id>
```

**Or** manually in MongoDB:
```javascript
db.users.updateOne(
  { email: "demo@example.com" },
  { $set: { isDemo: true } }
)
```

### Step 2: Test It

1. Log in with the demo user
2. Upload a business card
3. Watch the scan count decrease from 5 to 4
4. Refresh the page - count stays at 4
5. Log out and back in - count resets to 5

## ✨ That's It!

The system is now working with session-based limits for demo users.

## 📚 Learn More

- **Technical Details**: See `DEMO_USER_SESSION_LIMITS.md`
- **Testing Guide**: See `DEMO_USER_TESTING_GUIDE.md`
- **Full Summary**: See `DEMO_USER_IMPLEMENTATION_SUMMARY.md`

## 🎨 What Demo Users See

```
Upload Business Card
🎫 5 scans remaining (this session)  ← Fresh on login

↓ After scanning 2 cards ↓

Upload Business Card
🎫 3 scans remaining (this session)  ← Decreases with each scan

↓ After scanning 3 more ↓

Upload Business Card
🎫 0 scans remaining (this session)

❌ You have used all your demo scans for this session.
   Please log in again to get 5 new scans.
```

## 🔑 Key Features

- ✅ **5 scans per login** - Fresh start every time
- ✅ **Persists on refresh** - Scan count doesn't reset
- ✅ **No database** - Uses JWT tokens only
- ✅ **Clear messages** - Users know exactly what's happening
- ✅ **Easy to test** - Log out and back in to reset

## ❓ FAQ

**Q: How do I reset a demo user's scans?**  
A: They log out and log back in.

**Q: What happens if they refresh the page?**  
A: Their scan count persists (stored in JWT token).

**Q: Can they bypass the limit?**  
A: No, it's enforced server-side with signed JWT tokens.

**Q: Does it affect regular users?**  
A: No, regular users are completely unaffected.

**Q: Where are the scans stored?**  
A: In the JWT token - no database writes for demo users.

## 🐛 Troubleshooting

**Issue**: Scans reset to 5 on page refresh  
**Fix**: Check that frontend updates localStorage with new token

**Issue**: User can scan more than 5 cards  
**Fix**: Verify `isDemo: true` in the user document

**Issue**: No scan count shown  
**Fix**: Check that user logged in with demo account

## 🎉 Done!

Your demo users now have session-based limits. No further setup required!

---

**Need more details?** Check the other documentation files:
- 📖 `DEMO_USER_SESSION_LIMITS.md` - Full technical documentation
- 🧪 `DEMO_USER_TESTING_GUIDE.md` - Comprehensive testing steps
- 📝 `DEMO_USER_IMPLEMENTATION_SUMMARY.md` - Implementation overview

