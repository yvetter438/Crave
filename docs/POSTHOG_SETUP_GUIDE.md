# PostHog Analytics Setup Guide

## ✅ **Current Status: WORKING!**

PostHog is successfully integrated and tracking events. You can see events in the PostHog dashboard under:
- **People** → Click on any user → **Events** tab

## 📊 **Events Currently Being Tracked:**

### **Authentication Events:**
- `user_signed_in` - When users log in with real email
- `user_signed_out` - When users log out
- `app_started` - When app launches

### **Onboarding Events:**
- `onboarding_started` - When user begins onboarding
- `onboarding_completed` - When user finishes setup

### **Video Content Events:**
- `video_upload_started` - When upload begins
- `video_upload_completed` - When upload succeeds
- `video_upload_failed` - When upload fails

### **User Interaction Events:**
- `video_viewed` - When videos are watched
- `video_liked` - When videos are liked
- `video_saved` - When videos are saved
- `comment_posted` - When comments are made
- `user_followed` - When users follow others
- `search_performed` - When users search
- `content_reported` - When content is reported

## 🔧 **Configuration:**

### **API Key Storage:**
- **Current:** Hardcoded in `config/posthog.ts`
- **Recommended:** Set environment variables:
  ```bash
  EXPO_PUBLIC_POSTHOG_API_KEY=phc_muxd531JqOOb1zbCcOObssnVxln04ADsbGzb7gNOwPM
  EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
  ```

### **User Identification:**
- **Real users:** Identified by their actual email when they sign in
- **Test users:** No longer created (removed test user creation)

## 📈 **How to View Events:**

### **Method 1: People Section**
1. Go to **People** in PostHog dashboard
2. Click on any user (they'll have real email addresses)
3. Click **Events** tab to see their event history

### **Method 2: Create Insights**
1. Go to **Product Analytics** → **Insights**
2. Click **New Insight**
3. Choose **Event** or **Line Chart**
4. Select any event (e.g., `app_started`, `video_upload_completed`)

### **Method 3: Live Events**
- Look for **Live Events** or **Event Stream** in the dashboard
- This shows real-time event flow

## 🎯 **Next Steps:**

1. **Test with real users:** Sign up, complete onboarding, upload videos
2. **Create dashboards:** Build custom charts for key metrics
3. **Set up funnels:** Track user journeys (signup → onboarding → upload)
4. **Monitor errors:** Watch for `video_upload_failed` events

## 🚀 **Pro Tips:**

- **Real-time monitoring:** Use Live Events to watch events as they happen
- **User journey analysis:** Click on individual users to see their complete journey
- **Error tracking:** Monitor failed events to identify issues
- **Custom dashboards:** Create charts for your most important metrics

## 🔍 **Debugging:**

If events stop working:
1. Check console logs for PostHog messages
2. Verify API key is correct
3. Check network connectivity
4. Look for error messages in PostHog dashboard

---

**PostHog is now fully integrated and ready to scale with your app!** 🎉
