import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect } from "react";
import * as Linking from 'expo-linking';
import { supabase } from "@/lib/supabase";

export default function RootLayout() {
  useEffect(() => {
    // Handle deep link authentication (email confirmation, password reset, etc.)
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      
      // Check if this is a Supabase auth callback
      if (url.includes('#access_token') || url.includes('?access_token')) {
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
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
          }
        }
      }
    };

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false}}>
        <Stack.Screen name="index" />
      </Stack>
    </AuthProvider>
  );
}
