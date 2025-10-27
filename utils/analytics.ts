import { usePostHog } from 'posthog-react-native';

// Custom hook for analytics
export const useAnalytics = () => {
  const posthog = usePostHog();

  const track = (event: string, properties?: Record<string, any>) => {
    try {
      const eventData = {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: 'mobile',
      };
      
      posthog.capture(event, eventData);
      
      // Count engagement actions (for session tracking)
      const engagementEvents = [
        'video_liked', 'video_unliked', 'video_saved', 'video_shared',
        'comment_posted', 'comment_liked', 'user_followed', 'user_unfollowed',
        'search_performed', 'video_upload_completed', 'profile_viewed'
      ];
      
      if (engagementEvents.includes(event)) {
        // This will be used by session tracker to count actions
        console.log(`📊 Engagement action: ${event}`);
      }
      
      // Only log important events, not every single one
      if (['user_signed_in', 'user_signed_out', 'video_liked', 'video_upload_completed', 'onboarding_completed'].includes(event)) {
        console.log(`📊 ${event}:`, eventData);
      }
    } catch (error) {
      console.error('❌ Analytics tracking error:', error);
    }
  };

  const identify = (userId: string, properties?: Record<string, any>) => {
    try {
      posthog.identify(userId, properties);
      console.log(`📊 ANALYTICS IDENTIFY: User identified`);
      console.log(`📊 User ID:`, userId);
      console.log(`📊 User Properties:`, JSON.stringify(properties, null, 2));
      console.log(`📊 PostHog Status:`, posthog ? 'Connected' : 'Not Connected');
    } catch (error) {
      console.error('❌ Analytics identify error:', error);
    }
  };

  const setUserProperties = (properties: Record<string, any>) => {
    try {
      // Use identify to set user properties
      posthog.identify(undefined, properties);
      console.log(`📊 ANALYTICS SET PROPERTIES: User properties updated`);
      console.log(`📊 Properties:`, JSON.stringify(properties, null, 2));
      console.log(`📊 PostHog Status:`, posthog ? 'Connected' : 'Not Connected');
    } catch (error) {
      console.error('❌ Analytics set properties error:', error);
    }
  };

  const reset = () => {
    try {
      posthog.reset();
      console.log(`📊 ANALYTICS RESET: User session reset`);
      console.log(`📊 PostHog Status:`, posthog ? 'Connected' : 'Not Connected');
    } catch (error) {
      console.error('❌ Analytics reset error:', error);
    }
  };

  return {
    track,
    identify,
    setUserProperties,
    reset,
  };
};

// Predefined event tracking functions for common Crave actions
export const trackUserEvents = {
  // Authentication & User Acquisition
  signUp: (method: 'email' | 'apple' | 'google') => ({
    event: 'user_signed_up',
    properties: { 
      method, 
      platform: 'mobile',
      acquisition_channel: 'mobile_app',
      signup_timestamp: new Date().toISOString()
    }
  }),
  
  signIn: (method: 'email' | 'apple' | 'google') => ({
    event: 'user_signed_in',
    properties: { 
      method, 
      platform: 'mobile',
      login_timestamp: new Date().toISOString()
    }
  }),

  signOut: () => ({
    event: 'user_signed_out',
    properties: { 
      platform: 'mobile',
      logout_timestamp: new Date().toISOString()
    }
  }),

  // Onboarding & User Acquisition
  onboardingStarted: () => ({
    event: 'onboarding_started',
    properties: { 
      platform: 'mobile',
      start_timestamp: new Date().toISOString()
    }
  }),

  onboardingStepCompleted: (step: number, totalSteps: number, stepName: string) => ({
    event: 'onboarding_step_completed',
    properties: { 
      step, 
      totalSteps, 
      stepName,
      platform: 'mobile',
      completion_timestamp: new Date().toISOString()
    }
  }),

  onboardingCompleted: (step: number, totalSteps: number, completionTime: number) => ({
    event: 'onboarding_completed',
    properties: { 
      step, 
      totalSteps, 
      completion_time_seconds: completionTime,
      platform: 'mobile',
      completion_timestamp: new Date().toISOString()
    }
  }),

  onboardingAbandoned: (step: number, totalSteps: number, timeSpent: number) => ({
    event: 'onboarding_abandoned',
    properties: { 
      step, 
      totalSteps, 
      time_spent_seconds: timeSpent,
      platform: 'mobile',
      abandonment_timestamp: new Date().toISOString()
    }
  }),

  // App Usage & Engagement
  appOpened: (sessionId: string, isFirstOpen: boolean) => ({
    event: 'app_opened',
    properties: { 
      session_id: sessionId,
      is_first_open: isFirstOpen,
      platform: 'mobile',
      open_timestamp: new Date().toISOString()
    }
  }),

  appBackgrounded: (sessionId: string, sessionLength: number) => ({
    event: 'app_backgrounded',
    properties: { 
      session_id: sessionId,
      session_length_seconds: sessionLength,
      platform: 'mobile',
      background_timestamp: new Date().toISOString()
    }
  }),

  sessionStarted: (sessionId: string) => ({
    event: 'session_started',
    properties: { 
      session_id: sessionId,
      platform: 'mobile',
      start_timestamp: new Date().toISOString()
    }
  }),

  sessionEnded: (sessionId: string, sessionLength: number, actionsPerformed: number) => ({
    event: 'session_ended',
    properties: { 
      session_id: sessionId,
      session_length_seconds: sessionLength,
      actions_performed: actionsPerformed,
      platform: 'mobile',
      end_timestamp: new Date().toISOString()
    }
  }),

  // Screen Views & Navigation
  screenViewed: (screenName: string, previousScreen?: string, timeOnPreviousScreen?: number) => ({
    event: 'screen_viewed',
    properties: { 
      screen_name: screenName,
      previous_screen: previousScreen,
      time_on_previous_screen: timeOnPreviousScreen,
      platform: 'mobile',
      view_timestamp: new Date().toISOString()
    }
  }),

  // Video Content & Engagement
  videoUploadStarted: (duration?: number, fileSize?: number) => ({
    event: 'video_upload_started',
    properties: { 
      duration, 
      fileSize, 
      platform: 'mobile',
      upload_timestamp: new Date().toISOString()
    }
  }),

  videoUploadCompleted: (duration: number, fileSize: number, thumbnailGenerated: boolean, uploadTime: number) => ({
    event: 'video_upload_completed',
    properties: { 
      duration, 
      fileSize, 
      thumbnailGenerated,
      upload_time_seconds: uploadTime,
      platform: 'mobile',
      completion_timestamp: new Date().toISOString()
    }
  }),

  videoUploadFailed: (error: string, duration?: number, fileSize?: number) => ({
    event: 'video_upload_failed',
    properties: { 
      error, 
      duration, 
      fileSize, 
      platform: 'mobile',
      failure_timestamp: new Date().toISOString()
    }
  }),

  videoViewed: (videoId: string, duration: number, watchTime: number, isAutoplay: boolean) => ({
    event: 'video_viewed',
    properties: { 
      videoId, 
      duration, 
      watchTime,
      watch_percentage: duration > 0 ? (watchTime / duration) * 100 : 0,
      is_autoplay: isAutoplay,
      platform: 'mobile',
      view_timestamp: new Date().toISOString()
    }
  }),

  videoLiked: (videoId: string, userId: string) => ({
    event: 'video_liked',
    properties: { 
      videoId, 
      userId,
      platform: 'mobile',
      like_timestamp: new Date().toISOString()
    }
  }),

  videoUnliked: (videoId: string, userId: string) => ({
    event: 'video_unliked',
    properties: { 
      videoId, 
      userId,
      platform: 'mobile',
      unlike_timestamp: new Date().toISOString()
    }
  }),

  videoSaved: (videoId: string, userId: string) => ({
    event: 'video_saved',
    properties: { 
      videoId, 
      userId,
      platform: 'mobile',
      save_timestamp: new Date().toISOString()
    }
  }),

  videoUnsaved: (videoId: string, userId: string) => ({
    event: 'video_unsaved',
    properties: { 
      videoId, 
      userId,
      platform: 'mobile',
      unsave_timestamp: new Date().toISOString()
    }
  }),

  videoShared: (videoId: string, method: string, userId: string) => ({
    event: 'video_shared',
    properties: { 
      videoId, 
      method, 
      userId,
      platform: 'mobile',
      share_timestamp: new Date().toISOString()
    }
  }),

  // Comments & Social Engagement
  commentPosted: (videoId: string, isReply: boolean, commentLength: number) => ({
    event: 'comment_posted',
    properties: { 
      videoId, 
      isReply,
      comment_length: commentLength,
      platform: 'mobile',
      post_timestamp: new Date().toISOString()
    }
  }),

  commentLiked: (commentId: string, userId: string) => ({
    event: 'comment_liked',
    properties: { 
      commentId, 
      userId,
      platform: 'mobile',
      like_timestamp: new Date().toISOString()
    }
  }),

  commentUnliked: (commentId: string, userId: string) => ({
    event: 'comment_unliked',
    properties: { 
      commentId, 
      userId,
      platform: 'mobile',
      unlike_timestamp: new Date().toISOString()
    }
  }),

  // User Interactions & Social
  profileViewed: (profileId: string, isOwnProfile: boolean) => ({
    event: 'profile_viewed',
    properties: { 
      profileId, 
      isOwnProfile, 
      platform: 'mobile',
      view_timestamp: new Date().toISOString()
    }
  }),

  userFollowed: (userId: string, followerId: string) => ({
    event: 'user_followed',
    properties: { 
      userId, 
      followerId,
      platform: 'mobile',
      follow_timestamp: new Date().toISOString()
    }
  }),

  userUnfollowed: (userId: string, followerId: string) => ({
    event: 'user_unfollowed',
    properties: { 
      userId, 
      followerId,
      platform: 'mobile',
      unfollow_timestamp: new Date().toISOString()
    }
  }),

  // Search & Discovery
  searchPerformed: (query: string, type: 'users' | 'restaurants' | 'all', resultsCount: number) => ({
    event: 'search_performed',
    properties: { 
      query, 
      type, 
      results_count: resultsCount,
      platform: 'mobile',
      search_timestamp: new Date().toISOString()
    }
  }),

  searchResultClicked: (query: string, resultType: 'user' | 'restaurant', resultId: string) => ({
    event: 'search_result_clicked',
    properties: { 
      query, 
      resultType, 
      resultId,
      platform: 'mobile',
      click_timestamp: new Date().toISOString()
    }
  }),

  // Restaurant & Location
  restaurantSelected: (restaurantId: number, restaurantName: string) => ({
    event: 'restaurant_selected',
    properties: { 
      restaurantId, 
      restaurantName, 
      platform: 'mobile',
      selection_timestamp: new Date().toISOString()
    }
  }),

  // Moderation & Safety
  contentReported: (contentType: 'video' | 'comment' | 'user', contentId: string, reason: string) => ({
    event: 'content_reported',
    properties: { 
      contentType, 
      contentId, 
      reason, 
      platform: 'mobile',
      report_timestamp: new Date().toISOString()
    }
  }),

  userBlocked: (userId: string, blockedUserId: string) => ({
    event: 'user_blocked',
    properties: { 
      userId, 
      blockedUserId,
      platform: 'mobile',
      block_timestamp: new Date().toISOString()
    }
  }),

  // Content Moderation (for admin tracking)
  contentApproved: (contentId: string, contentType: 'video' | 'comment', moderatorId: string) => ({
    event: 'content_approved',
    properties: { 
      contentId, 
      contentType, 
      moderatorId,
      platform: 'mobile',
      approval_timestamp: new Date().toISOString()
    }
  }),

  contentRejected: (contentId: string, contentType: 'video' | 'comment', moderatorId: string, reason: string) => ({
    event: 'content_rejected',
    properties: { 
      contentId, 
      contentType, 
      moderatorId, 
      reason,
      platform: 'mobile',
      rejection_timestamp: new Date().toISOString()
    }
  }),

  // Errors & Performance
  errorOccurred: (error: string, screen: string, userId?: string, errorCode?: string) => ({
    event: 'error_occurred',
    properties: { 
      error, 
      screen, 
      userId, 
      errorCode,
      platform: 'mobile',
      error_timestamp: new Date().toISOString()
    }
  }),

  // Retention & Churn
  userReturned: (daysSinceLastVisit: number, totalVisits: number) => ({
    event: 'user_returned',
    properties: { 
      days_since_last_visit: daysSinceLastVisit,
      total_visits: totalVisits,
      platform: 'mobile',
      return_timestamp: new Date().toISOString()
    }
  }),

  userChurned: (daysSinceLastVisit: number, totalVisits: number, lastAction: string) => ({
    event: 'user_churned',
    properties: { 
      days_since_last_visit: daysSinceLastVisit,
      total_visits: totalVisits,
      last_action: lastAction,
      platform: 'mobile',
      churn_timestamp: new Date().toISOString()
    }
  }),

  // Engagement Depth Tracking
  engagementSession: (sessionId: string, duration: number, actionsPerformed: number, engagementScore: number) => ({
    event: 'engagement_session',
    properties: { 
      session_id: sessionId,
      duration_seconds: duration,
      actions_performed: actionsPerformed,
      engagement_score: engagementScore,
      engagement_level: engagementScore > 10 ? 'high' : engagementScore > 5 ? 'medium' : 'low',
      platform: 'mobile',
      session_timestamp: new Date().toISOString()
    }
  }),

  dailyEngagement: (date: string, opens: number, totalDuration: number, actionsCount: number) => ({
    event: 'daily_engagement',
    properties: { 
      date,
      daily_opens: opens,
      total_duration_seconds: totalDuration,
      total_actions: actionsCount,
      avg_session_duration: opens > 0 ? Math.round(totalDuration / opens) : 0,
      platform: 'mobile',
      engagement_timestamp: new Date().toISOString()
    }
  }),
};

// Helper function to track screen views
export const trackScreenView = (screenName: string, properties?: Record<string, any>) => {
  return {
    event: 'screen_viewed',
    properties: {
      screenName,
      platform: 'mobile',
      ...properties,
    }
  };
};
