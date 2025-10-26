# 🖼️ Supabase Avatar Storage Configuration Fix

## 🚨 **Issue Identified**
```
ERROR: mime type application/json, image/png is not supported
```

This error occurs because your Supabase storage bucket has restrictive MIME type settings that don't allow image uploads.

---

## ✅ **Solution: Update Supabase Storage Settings**

### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project dashboard
2. Navigate to **Storage** in the sidebar
3. Click on your **avatars** bucket

### **Step 2: Update Bucket Settings**
1. Click the **Settings** tab (or gear icon)
2. Look for **"Allowed MIME types"** or **"File type restrictions"**
3. **Current setting:** Probably very restrictive or empty
4. **New setting:** Add these MIME types:

```
image/*
image/jpeg
image/jpg
image/png
image/webp
image/gif
```

### **Step 3: Alternative - Create New Bucket**
If you can't edit the existing bucket, create a new one:

1. **Create new bucket** named `avatars` (or `user-avatars`)
2. **Set MIME types** to `image/*` 
3. **Make it public** for profile images
4. **Update RLS policies** as needed

---

## 🔧 **Recommended Supabase Storage Configuration**

### **Bucket Settings:**
```
Bucket Name: avatars
Public: Yes (for profile images)
Allowed MIME types: image/*
File size limit: 5MB (reasonable for avatars)
```

### **RLS Policies for Avatars Bucket:**
```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🛠️ **Code Fix (Also Needed)**

The upload code also needs a small fix for better React Native compatibility:

```typescript
// Current approach in onboarding.tsx
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, {
    uri: avatarUri,
    type: `image/${fileExt}`,
    name: fileName,
  } as any, {
    contentType: `image/${fileExt}`,
    upsert: false,
  });
```

**Better approach:**
```typescript
// Use fetch to get the file as blob first
const response = await fetch(avatarUri);
const blob = await response.blob();

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, blob, {
    contentType: `image/${fileExt}`,
    upsert: false,
  });
```

---

## 🎯 **Quick Fix Steps**

### **Immediate Solution:**
1. **Go to Supabase Storage settings**
2. **Change MIME types to:** `image/*`
3. **Save settings**
4. **Test avatar upload again**

### **If That Doesn't Work:**
1. **Delete existing avatars bucket**
2. **Create new bucket with proper settings**
3. **Update code to use new bucket name**

---

## 🧪 **Test After Fix**

1. **Try uploading avatar** in onboarding
2. **Should work without MIME type error**
3. **Check that image appears** in profile
4. **Verify public access** to avatar URLs

---

## 📋 **Recommended MIME Type Settings**

### **For Avatars Bucket:**
```
image/*          (covers all image types)
image/jpeg       (JPEG photos)
image/jpg        (JPG photos) 
image/png        (PNG images)
image/webp       (Modern web format)
image/gif        (Animated avatars)
```

### **For Videos Bucket (if you have one):**
```
video/*
video/mp4
video/mov
video/avi
```

---

## ⚠️ **Important Notes**

### **Security Considerations:**
- ✅ **Only allow image types** for avatars
- ✅ **Set reasonable file size limits** (5MB max)
- ✅ **Use RLS policies** to control access
- ✅ **Validate file types** in your app code too

### **Performance Tips:**
- 🔶 **Compress images** before upload
- 🔶 **Resize to reasonable dimensions** (500x500px max)
- 🔶 **Use WebP format** when possible for smaller files

---

## 🚀 **Expected Result**

After fixing the MIME type settings:
- ✅ Avatar uploads work without errors
- ✅ Images display properly in profiles
- ✅ Public access to avatar URLs works
- ✅ Onboarding flow completes successfully

The key is setting the bucket to accept `image/*` MIME types!
