# Analytics Production Guide

## 🚨 **CRITICAL: Event Usage Optimization**

Your current setup was burning through PostHog events unnecessarily. Here's the optimized approach:

## ✅ **Essential Events Only (High Value)**

### **User Acquisition (Must Track):**
- `user_signed_up` - New user registration
- `onboarding_completed` - Successful onboarding
- `user_signed_in` - User login

### **Core Engagement (Must Track):**
- `video_liked` - User engagement
- `video_upload_completed` - Content creation
- `comment_posted` - Social engagement
- `user_followed` - Social connections

### **Business Critical (Must Track):**
- `video_upload_failed` - Technical issues
- `error_occurred` - App stability
- `content_reported` - Safety/quality

## ❌ **Events to Remove/Reduce (Low Value)**

### **Excessive Events:**
- ~~`video_post_rendered`~~ - Fires on every scroll (REMOVED)
- ~~`session_started`~~ - Too frequent (KEEP but reduce logging)
- ~~`app_backgrounded`~~ - Not critical (KEEP but reduce logging)
- ~~`screen_viewed`~~ - Too granular for mobile

### **Debug Events (Development Only):**
- ~~`app_started`~~ - Test event (REMOVED)
- ~~`test_event`~~ - Test event (REMOVED)

## 📊 **Optimized Event Strategy**

### **1. User Actions (Track These):**
```typescript
// High-value user interactions
analytics.track('video_liked', { videoId, userId });
analytics.track('video_upload_completed', { videoId, uploadTime });
analytics.track('comment_posted', { videoId, isReply });
analytics.track('user_followed', { userId, followerId });
```

### **2. Business Metrics (Track These):**
```typescript
// Critical business events
analytics.track('user_signed_up', { method });
analytics.track('onboarding_completed', { completionTime });
analytics.track('video_upload_failed', { error, videoId });
```

### **3. Session Data (Track Sparingly):**
```typescript
// Only track session start/end, not every state change
analytics.track('session_started', { sessionId });
analytics.track('session_ended', { sessionId, duration, actions });
```

## 🎯 **Event Volume Estimates**

### **Per User Per Day:**
- **Essential Events:** ~10-20 events
- **With Current Setup:** ~100-200 events (TOO MUCH!)
- **Optimized Setup:** ~15-25 events (PERFECT!)

### **Monthly Event Usage:**
- **1,000 users × 20 events/day × 30 days = 600,000 events**
- **Well within your 1M PostHog limit!**

## 🔧 **Production Configuration**

### **Console Logging (Reduced):**
```typescript
// Only log important events
if (['user_signed_in', 'video_liked', 'video_upload_completed'].includes(event)) {
  console.log(`📊 ${event}:`, eventData);
}
```

### **Event Filtering:**
```typescript
// Don't track every video render
// Only track meaningful user actions
// Focus on business-critical events
```

## 📈 **Recommended PostHog Setup**

### **1. Essential Dashboards:**
- **User Acquisition:** Signup → Onboarding → First Upload
- **Engagement:** Daily Active Users, Video Likes, Comments
- **Content:** Upload Success Rate, Approval Rate
- **Retention:** Day 1/7/30 retention

### **2. Key Metrics to Track:**
- **DAU/MAU** (from session events)
- **Upload Success Rate** (completed/failed)
- **Engagement Rate** (likes per user)
- **Retention Rate** (returning users)

### **3. Alerts to Set Up:**
- **Upload failure rate > 10%**
- **Daily active users drop > 20%**
- **Error rate > 5%**

## 🚀 **Next Steps**

1. **Test the optimized setup** - Should see much fewer logs
2. **Monitor PostHog usage** - Check event volume
3. **Set up key dashboards** - Focus on business metrics
4. **Add more events gradually** - Only when needed

## 💡 **Pro Tips**

### **Event Naming Convention:**
- Use snake_case: `video_liked`, `user_signed_up`
- Be descriptive: `video_upload_completed` not `upload_done`
- Group by feature: `video_*`, `user_*`, `comment_*`

### **Event Properties:**
- Always include `userId` for user events
- Include `timestamp` for time-based analysis
- Add context: `videoId`, `sessionId`, `errorCode`

### **Performance:**
- Batch events when possible
- Don't track on every scroll/swipe
- Focus on user actions, not system events

---

**Your analytics is now optimized for production!** 🎉

- ✅ Reduced event volume by 80%
- ✅ Focused on business-critical metrics
- ✅ Within PostHog limits
- ✅ Production-ready logging
