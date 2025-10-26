# 🖼️ Avatar Upload Troubleshooting Guide

## 🚨 **Issue Analysis**

The error `mime type application/json, image/png is not supported` suggests multiple potential issues:

1. **React Native file handling** - RN doesn't handle files the same as web
2. **iOS screenshot format** - Screenshots might have different MIME types
3. **Supabase upload format** - Wrong file object structure
4. **Content-Type mismatch** - Server receiving wrong MIME type

---

## ✅ **Fixes Implemented**

### **1. Fixed Deprecated ImagePicker**
```typescript
// OLD (deprecated):
mediaTypes: ImagePicker.MediaTypeOptions.Images

// NEW (current):
mediaTypes: ImagePicker.MediaType.Images
```

### **2. Improved File Handling**
```typescript
// Handle iOS screenshots properly
let fileExt = avatarUri.split('.').pop()?.toLowerCase() ?? 'jpg';

// iOS screenshots might not have proper extensions
if (avatarUri.includes('ph://') || avatarUri.includes('assets-library://')) {
  fileExt = 'jpg'; // iOS screenshots are typically JPG
}
```

### **3. Better Upload Method**
```typescript
// Use fetch + blob for more reliable uploads
const response = await fetch(avatarUri);
const blob = await response.blob();

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, blob, {
    contentType: mimeType,
    upsert: false,
  });
```

### **4. Enhanced Error Logging**
Added detailed console logs to debug the upload process.

---

## 🔍 **Debugging Steps**

### **Test the Upload Again:**
1. **Try uploading an avatar** in onboarding
2. **Check console logs** for detailed information:
   ```
   Uploading avatar: { fileName, avatarUri, fileExt, mimeType }
   Blob created: { type, size }
   Upload successful: { data }
   ```
3. **Look for specific error messages**

### **Common Issues & Solutions:**

#### **Issue 1: iOS Screenshot Format**
```
Problem: iOS screenshots have weird URIs (ph://, assets-library://)
Solution: ✅ Added special handling for iOS URIs
```

#### **Issue 2: Wrong MIME Type**
```
Problem: Server receiving 'application/json' instead of 'image/png'
Solution: ✅ Using fetch + blob ensures proper MIME type
```

#### **Issue 3: File Object Structure**
```
Problem: Supabase expects different file format in React Native
Solution: ✅ Using blob instead of file object
```

---

## 🛠️ **Alternative Solutions**

### **If Upload Still Fails:**

#### **Option 1: Base64 Upload**
```typescript
// Convert to base64 and upload
import * as FileSystem from 'expo-file-system';

const base64 = await FileSystem.readAsStringAsync(avatarUri, {
  encoding: FileSystem.EncodingType.Base64,
});

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, decode(base64), {
    contentType: mimeType,
  });
```

#### **Option 2: Skip Avatar in Onboarding**
```typescript
// Allow users to skip avatar upload during onboarding
// Add avatar upload to settings page instead
// This removes the blocker from profile completion
```

#### **Option 3: Use Different Storage**
```typescript
// Upload to a different bucket or service
// Cloudinary, AWS S3, etc.
```

---

## 🧪 **Testing Checklist**

### **Test Different Image Types:**
- [ ] **iPhone screenshot** (PNG)
- [ ] **Camera photo** (JPEG)
- [ ] **Downloaded image** (various formats)
- [ ] **Edited photo** (from photo editor)

### **Test Different Scenarios:**
- [ ] **New user onboarding**
- [ ] **Existing user profile update**
- [ ] **Different file sizes**
- [ ] **Different aspect ratios**

---

## 📊 **Expected Console Output**

### **Successful Upload:**
```
Uploading avatar: {
  fileName: "user123-1234567890.jpg",
  avatarUri: "file:///path/to/image.jpg",
  fileExt: "jpg",
  mimeType: "image/jpeg"
}

Blob created: {
  type: "image/jpeg",
  size: 245760
}

Upload successful: {
  path: "user123-1234567890.jpg"
}
```

### **Failed Upload:**
```
Supabase upload error: {
  message: "mime type application/json, image/png is not supported",
  statusCode: 400
}
```

---

## 🎯 **Next Steps**

### **If Upload Still Fails:**

1. **Check Supabase Storage Policies**
   ```sql
   -- Verify RLS policies allow uploads
   SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
   ```

2. **Test with Simple Image**
   - Try with a basic JPEG from camera
   - Avoid screenshots initially

3. **Check Bucket Configuration**
   - Verify `image/*` is allowed
   - Check file size limits
   - Ensure bucket is public

4. **Alternative: Skip Avatar Upload**
   - Allow onboarding without avatar
   - Add avatar upload to settings later

---

## 🚨 **Emergency Workaround**

If avatar upload continues to fail, we can temporarily disable it:

```typescript
// In onboarding.tsx - comment out avatar upload
const completeOnboarding = async () => {
  // Skip avatar upload for now
  // const avatarPath = await uploadAvatar();
  const avatarPath = null;
  
  // Continue with profile update...
};
```

This allows users to complete onboarding while we debug the upload issue.

---

## 📋 **Report Back**

After testing, please share:
1. **Console log output** from the upload attempt
2. **Specific error messages** if any
3. **Image type** you're testing with (screenshot, camera, etc.)
4. **Device type** (iOS/Android)

This will help pinpoint the exact issue!
