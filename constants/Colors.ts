/**
 * Crave Brand Colors - 2025
 * Modern color palette with brand consistency
 */

const tintColorLight = '#FE3A08'; // Updated to brand primary
const tintColorDark = '#FF7A25'; // Updated to brand secondary

export const Colors = {
  // Brand Core
  primary: "#FE3A08",   // main brand orange-red
  primaryDark: "#FD2B05", // stronger red variant
  secondary: "#FF7A25", // warm orange for accents
  accent: "#F92417",    // deep red for CTAs/highlights

  // Neutral
  background: "#FEFEFE",
  surface: "#FFFFFF",       // for cards, modals
  border: "rgba(0,0,0,0.1)",

  // Text
  text: "#1A1A1A",          // black
  textSecondary: "#6B6B6B",
  textInverse: "#FEFEFE",

  // States
  success: "#06D6A0",
  error: "#F92417",
  warning: "#FF7A25",

  // Legacy support (for existing components)
  light: {
    text: '#1A1A1A',
    background: '#FEFEFE',
    tint: tintColorLight,
    icon: '#6B6B6B',
    tabIconDefault: '#6B6B6B',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FEFEFE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Gradients = {
  brand: ["#FF7A25", "#FE3A08", "#FD2B05", "#F92417"],
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
