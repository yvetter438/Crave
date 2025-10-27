import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActivePostProvider } from "@/context/ActivePostContext";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from "@/lib/supabase";
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { POSTHOG_CONFIG } from '../config/posthog';
import * as Sentry from '@sentry/react-native';
// AppsFlyer removed - using attribution-only setup

// Sentry configuration
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://d0f8731573d0b3a1a83f177bf338116e@o4510258583764992.ingest.us.sentry.io/4510258637570048';

Sentry.init({
  dsn: sentryDsn,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // Enable debug only in development
  debug: __DEV__,
  
  // Production configuration
  environment: __DEV__ ? 'development' : 'production',
  
  // Sample rate for production (reduce noise)
  sampleRate: __DEV__ ? 1.0 : 0.1,
  
  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// AppsFlyer removed - using attribution-only setup

// Session tracking component
function SessionTracker() {
  const posthog = usePostHog();
  const sessionStartTime = useRef<number>(Date.now());
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const actionsCount = useRef<number>(0);
  const lastScreenViewTime = useRef<number>(Date.now());
  const currentScreen = useRef<string>('app_start');
  const dailyOpensCount = useRef<number>(0);
  const lastOpenDate = useRef<string>(new Date().toDateString());

  useEffect(() => {
    // Track session start
    const sessionData = {
      session_id: sessionId.current,
      platform: 'mobile',
      start_timestamp: new Date().toISOString()
    };
    posthog.capture('session_started', sessionData);
    // Only log session start once per app launch
    console.log(`📊 Session started: ${sessionId.current}`);

    // Track daily app opens (smart tracking)
    const today = new Date().toDateString();
    const isNewDay = lastOpenDate.current !== today;
    
    if (isNewDay) {
      dailyOpensCount.current = 1;
      lastOpenDate.current = today;
    } else {
      dailyOpensCount.current += 1;
    }

    // Track app opened with daily context
    const appOpenData = {
      session_id: sessionId.current,
      is_first_open_today: dailyOpensCount.current === 1,
      daily_opens_count: dailyOpensCount.current,
      platform: 'mobile',
      open_timestamp: new Date().toISOString()
    };
    posthog.capture('app_opened', appOpenData);
    
    // Log only first open of the day
    if (dailyOpensCount.current === 1) {
      console.log(`📊 First app open today (${today})`);
    }

    // Track app state changes (prevent duplicate events)
    let isBackgrounded = false;
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if ((nextAppState === 'background' || nextAppState === 'inactive') && !isBackgrounded) {
        isBackgrounded = true;
        const sessionLength = Date.now() - sessionStartTime.current;
        const backgroundData = {
          session_id: sessionId.current,
          session_length_seconds: Math.floor(sessionLength / 1000),
          platform: 'mobile',
          background_timestamp: new Date().toISOString()
        };
        posthog.capture('app_backgrounded', backgroundData);
        console.log(`📊 App backgrounded after ${Math.floor(sessionLength / 1000)}s`);
      } else if (nextAppState === 'active' && isBackgrounded) {
        isBackgrounded = false;
        // App came back to foreground
        const resumeData = {
          session_id: sessionId.current,
          platform: 'mobile',
          resume_timestamp: new Date().toISOString()
        };
        posthog.capture('app_resumed', resumeData);
        console.log(`📊 App resumed`);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      // Track session end with engagement metrics
      const sessionLength = Date.now() - sessionStartTime.current;
      const sessionDurationSeconds = Math.floor(sessionLength / 1000);
      
      // Calculate engagement score (duration + actions)
      const engagementScore = Math.min(actionsCount.current + Math.floor(sessionDurationSeconds / 30), 20);
      
      const sessionEndData = {
        session_id: sessionId.current,
        session_length_seconds: sessionDurationSeconds,
        actions_performed: actionsCount.current,
        engagement_score: engagementScore,
        engagement_level: engagementScore > 10 ? 'high' : engagementScore > 5 ? 'medium' : 'low',
        platform: 'mobile',
        end_timestamp: new Date().toISOString()
      };
      posthog.capture('session_ended', sessionEndData);
      
      // Track engagement session (only if meaningful)
      if (sessionDurationSeconds > 10 || actionsCount.current > 0) {
        posthog.capture('engagement_session', {
          session_id: sessionId.current,
          duration_seconds: sessionDurationSeconds,
          actions_performed: actionsCount.current,
          engagement_score: engagementScore,
          engagement_level: engagementScore > 10 ? 'high' : engagementScore > 5 ? 'medium' : 'low',
          platform: 'mobile',
          session_timestamp: new Date().toISOString()
        });
      }
    };
  }, [posthog]);

  return null;
}

// Test component removed - using production analytics only

export default Sentry.wrap(function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Test PostHog initialization
    console.log('🚀 PostHog should be initializing...');
    console.log('📊 PostHog API Key:', process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_muxd531JqOOb1zbCcOObssnVxln04ADsbGzb7gNOwPM');
    // Handle app state changes (background/foreground)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - refresh auth session
        console.log('App resumed - refreshing session...');
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error refreshing session on app resume:', error);
          } else if (session) {
            console.log('Session refreshed successfully');
          }
        } catch (error) {
          console.error('Failed to refresh session:', error);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Handle deep link authentication (email confirmation, password reset, etc.)
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);
      
      // Check if this is a Supabase auth callback
      if (url.includes('#access_token') || url.includes('?access_token')) {
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        if (accessToken && refreshToken) {
          // Set the session from the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Error setting session from deep link:', error);
          } else {
            console.log('Successfully authenticated from email link!');
            
            // If this is a password recovery, navigate to reset password screen
            if (type === 'recovery') {
              // Use setTimeout to ensure navigation happens after auth state is updated
              setTimeout(() => {
                const { router } = require('expo-router');
                router.push('/reset-password');
              }, 100);
            }
          }
        }
      }
    };

    // Listen for incoming deep links
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
      linkingSubscription.remove();
    };
  }, []);

  return (
    <PostHogProvider 
      apiKey={POSTHOG_CONFIG.apiKey}
      options={POSTHOG_CONFIG.options}
    >
      <SessionTracker />
    <AuthProvider>
      <ActivePostProvider>
        <Stack screenOptions={{ headerShown: false, gestureEnabled: false}}>
          <Stack.Screen name="index" />
        </Stack>
      </ActivePostProvider>
    </AuthProvider>
    </PostHogProvider>
  );
});