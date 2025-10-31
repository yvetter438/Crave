import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type NeighborhoodBadgeProps = {
  label: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  intensity?: number; // blur intensity
};

export default function NeighborhoodBadge({ label, style, textStyle, intensity = 30 }: NeighborhoodBadgeProps) {
  return (
    <View style={[styles.wrapper, style]}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0.06)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <BlurView intensity={intensity} tint="dark" style={styles.blur} />
      <View style={styles.content}>
        <Text style={[styles.text, textStyle]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});


