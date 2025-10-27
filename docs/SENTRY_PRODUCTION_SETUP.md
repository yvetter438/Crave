# Sentry Production Setup Guide

## 🚀 **EAS Secrets Configuration**

To use Sentry in production builds, you need to add your Sentry DSN to EAS secrets:

### **1. Add Sentry DSN to EAS Secrets:**

```bash
# Add the Sentry DSN to EAS secrets
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://d0f8731573d0b3a1a83f177bf338116e@o4510258583764992.ingest.us.sentry.io/4510258637570048"
```

### **2. Verify Secrets:**

```bash
# List all secrets
eas secret:list
```

### **3. Build with Secrets:**

```bash
# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production
```

## 🔧 **What's Configured:**

### **Development:**
- ✅ Debug logging enabled
- ✅ Full error sampling (100%)
- ✅ Environment: `development`

### **Production:**
- ✅ Debug logging disabled
- ✅ Reduced error sampling (10% to avoid noise)
- ✅ Environment: `production`
- ✅ Automatic crash reporting
- ✅ Performance monitoring

## 📊 **What You'll Get:**

1. **Automatic Crash Reporting** - All unhandled errors are captured
2. **Performance Monitoring** - App performance metrics
3. **Release Tracking** - See which app versions have issues
4. **User Context** - Know which users are affected
5. **Breadcrumbs** - See what led to the error

## 🧪 **Testing in Production:**

1. **Build a production version** with EAS
2. **Install on device** (not Expo Go)
3. **Trigger an error** (intentionally or naturally)
4. **Check Sentry dashboard** for the error

## 📱 **Sentry Dashboard:**

- **Project URL:** https://sentry.io/organizations/crave-ek/projects/
- **Issues:** View all errors and crashes
- **Releases:** Track app versions
- **Performance:** Monitor app performance

## 🔍 **Monitoring:**

- **Set up alerts** for critical errors
- **Monitor error rates** by release
- **Track user impact** of crashes
- **Analyze performance** trends

---

**Sentry is now production-ready!** 🚀
