import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface CraveTabIconProps {
  focused: boolean;
  size?: number;
}

export function CraveTabIcon({ focused, size = 28 }: CraveTabIconProps) {
  return (
    <Image
      source={require('@/assets/images/icon.png')}
      style={[
        styles.logo,
        { 
          width: size, 
          height: size,
          opacity: focused ? 1 : 0.5, // More transparent when not focused
        }
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    tintColor: undefined, // Keep original colors
  },
});

