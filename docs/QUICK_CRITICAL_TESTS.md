# 🚀 Quick Critical Tests - 15 Minutes

## ⚡ **Essential Tests (Must Pass Before Launch)**

### **1. Core Video Feed (5 minutes)**
```
✅ Open app → Feed loads
✅ First video auto-plays
✅ Tap to pause/resume
✅ Double-tap to like (heart animation)
✅ Scroll to next video (smooth transition)
✅ Like button works (count updates)
✅ Comment button opens sheet
```

### **2. Comments System (3 minutes)**
```
✅ Comment sheet opens without errors
✅ Existing comments display with usernames
✅ Type and post new comment
✅ New comment appears immediately
✅ Close comment sheet
```

### **3. Post Details Navigation (4 minutes)**
```
✅ Go to Profile tab
✅ Tap any post thumbnail
✅ Post details opens in fullscreen
✅ Video plays correctly
✅ Back button returns to profile
✅ Go to different user profile
✅ Tap their post → opens with their context
✅ Back button works correctly
```

### **4. Critical Error Checks (3 minutes)**
```
✅ No crashes during normal usage
✅ No "Could not find relationship" errors
✅ Videos load without infinite loading
✅ Comments load without database errors
✅ Navigation doesn't break the stack
```

---

## 🔥 **If Any of These Fail - STOP AND FIX**

### **Showstopper Issues:**
- App crashes on startup
- Videos don't play
- Comments show database errors
- Navigation completely broken
- Can't post comments

### **Major Issues (Fix Before Launch):**
- Videos load very slowly
- Comments don't display usernames
- Back navigation doesn't work
- Like/save buttons don't work
- Memory leaks during scrolling

### **Minor Issues (Can Launch With):**
- Slight animation glitches
- Minor UI alignment issues
- Non-critical error logs
- Performance could be better

---

## 📱 **Quick Test Script**

**Total Time: ~15 minutes**

```bash
# 1. Basic Flow Test (5 min)
Open app
Scroll through 3-4 videos
Like 2 videos
Comment on 1 video
Share 1 video

# 2. Navigation Test (5 min)
Go to Profile
Tap a post → Post details
Back to profile
Search for another user
Tap their post → Post details
Back to their profile
Back to search

# 3. Comments Deep Test (5 min)
Open several comment sections
Post comments on different videos
Check if usernames display correctly
Test comment interactions (like, report)
Verify no database errors in logs
```

---

## 🎯 **Success Criteria**

### **✅ Ready to Launch If:**
- All core functionality works
- No crashes or database errors
- Comments system works properly
- Navigation flows correctly
- Performance is acceptable

### **❌ Not Ready If:**
- Any showstopper issues exist
- Comments don't load/post
- Videos don't play reliably
- Navigation is broken
- Major performance issues

---

## 📋 **Quick Checklist Format**

```
Date: ___________
Tester: _________
Device: _________

CORE FUNCTIONALITY:
□ Feed loads and plays videos
□ Comments open and display correctly  
□ Post details navigation works
□ No critical errors in logs

RESULT: ✅ PASS / ❌ FAIL

Issues Found:
1. ________________
2. ________________
3. ________________

Ready for Launch: YES / NO
```

This quick test should catch the most critical issues in just 15 minutes!
