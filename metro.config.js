const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const defaultConfig = getSentryExpoConfig(__dirname);
module.exports = defaultConfig;