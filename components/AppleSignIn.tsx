import React from 'react';
import { Platform, Alert, Dimensions } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get("window");

interface AppleSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const AppleSignIn: React.FC<AppleSignInProps> = ({ onSuccess, onError }) => {
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Sign in via Supabase Auth
      if (credential.identityToken) {
        const { error, data } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          console.error('Apple Sign In Error:', error);
          onError?.(error.message);
          Alert.alert('Sign In Failed', error.message);
        } else {
          console.log('Apple Sign In Success:', data.user);
          onSuccess?.();
        }
      } else {
        throw new Error('No identity token received from Apple');
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow - don't show error
        console.log('User canceled Apple Sign In');
      } else {
        console.error('Apple Sign In Error:', e);
        const errorMessage = e.message || 'Apple Sign In failed';
        onError?.(errorMessage);
        Alert.alert('Sign In Failed', errorMessage);
      }
    }
  };

  // Only show Apple Sign In on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
      cornerRadius={35}
      style={{ width: width - 40, height: 55 }}
      onPress={handleAppleSignIn}
    />
  );
};
