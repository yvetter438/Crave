import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActivePostProvider } from "@/context/ActivePostContext";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from "@/lib/supabase";

export default function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
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
    <AuthProvider>
      <ActivePostProvider>
        <Stack screenOptions={{ headerShown: false, gestureEnabled: false}}>
          <Stack.Screen name="index" />
        </Stack>
      </ActivePostProvider>
    </AuthProvider>
  );
}
