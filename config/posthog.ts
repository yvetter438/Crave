// PostHog Configuration
export const POSTHOG_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "phc_muxd531JqOOb1zbCcOObssnVxln04ADsbGzb7gNOwPM",
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  options: {
    // Enable autocapture for automatic event tracking
    autocapture: true,
    // Enable session replay (optional)
    session_recording: {
      enabled: true,
      maskAllInputs: true, // Mask sensitive inputs
      maskAllText: false, // Don't mask all text for better UX analysis
    },
    // Enable feature flags (useful for A/B testing)
    feature_flags: {
      enabled: true,
    },
    // Debug mode to see what's happening
    debug: true,
    // Disable automatic pageview tracking since we're in a mobile app
    capture_pageview: false,
  }
};

// Environment variables to set:
// EXPO_PUBLIC_POSTHOG_API_KEY=phc_muxd531JqOOb1zbCcOObssnVxln04ADsbGzb7gNOwPM
// EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
