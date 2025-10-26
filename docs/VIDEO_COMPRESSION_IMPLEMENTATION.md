# 📹 Video Compression Implementation Guide

## 🎯 Overview
Implement efficient video compression to reduce storage costs, improve upload speeds, and enhance user experience while maintaining acceptable quality for food videos.

## 🚀 Recommended Implementation Strategy

### **Phase 1: Client-Side Compression (Immediate)**

#### **1. Use expo-av with Compression Settings**
```javascript
import { Video } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';

// In your upload.tsx, modify the video picker
const pickVideo = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: true,
    quality: 0.7, // Compress to 70% quality
    videoMaxDuration: 180,
    videoQuality: ImagePicker.VideoQuality.Medium, // Key compression setting
  });
};
```

#### **2. Install React Native Video Processing**
```bash
npx expo install react-native-video-processing
# or
npm install react-native-ffmpeg-kit
```

#### **3. Implement Compression Function**
```javascript
import { VideoProcessing } from 'react-native-video-processing';

const compressVideo = async (videoUri: string) => {
  try {
    const compressedUri = await VideoProcessing.compress(videoUri, {
      width: 720,        // Max width (good for mobile)
      height: 1280,      // Max height (9:16 aspect ratio)
      bitrateMultiplier: 0.3, // Reduce bitrate to 30%
      fps: 30,           // Standard frame rate
      format: 'mp4',     // Ensure MP4 format
    });
    
    return compressedUri;
  } catch (error) {
    console.error('Compression failed:', error);
    return videoUri; // Fallback to original
  }
};
```

### **Phase 2: Server-Side Processing (Advanced)**

#### **1. Supabase Edge Functions with FFmpeg**
```javascript
// supabase/functions/compress-video/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { videoUrl } = await req.json()
  
  // Use FFmpeg to compress
  const command = [
    'ffmpeg',
    '-i', videoUrl,
    '-vcodec', 'libx264',
    '-crf', '28',        // Quality (18-28 range, 28 = smaller files)
    '-preset', 'fast',   // Encoding speed
    '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease',
    '-r', '30',          // 30 FPS
    '-maxrate', '1M',    // Max 1Mbps bitrate
    '-bufsize', '2M',    // Buffer size
    'output.mp4'
  ]
  
  // Execute compression and return compressed video URL
})
```

## 📊 Compression Targets for Food Videos

### **Quality Levels**
- **High Quality**: 720p, 2Mbps, 30fps (for featured content)
- **Standard**: 720p, 1Mbps, 30fps (default for user uploads)
- **Low Quality**: 480p, 500kbps, 24fps (for slow connections)

### **File Size Targets**
- **Original**: ~50-100MB (3 min video)
- **Compressed**: ~10-20MB (80% reduction)
- **Thumbnail**: <500KB

## 🛠 Implementation Steps

### **Step 1: Update Upload Flow**
```typescript
// In app/(tabs)/upload.tsx
const processVideo = async (videoUri: string) => {
  setUploading(true);
  setUploadProgress(10);
  
  try {
    // 1. Compress video
    const compressedUri = await compressVideo(videoUri);
    setUploadProgress(40);
    
    // 2. Generate thumbnail
    const thumbnail = await VideoThumbnails.getThumbnailAsync(compressedUri, {
      time: 1000, // 1 second in
      quality: 0.8,
    });
    setUploadProgress(60);
    
    // 3. Upload both files
    const videoUpload = uploadToSupabase(compressedUri, 'videos');
    const thumbUpload = uploadToSupabase(thumbnail.uri, 'thumbnails');
    
    const [videoResult, thumbResult] = await Promise.all([videoUpload, thumbUpload]);
    setUploadProgress(100);
    
    return { videoUrl: videoResult.url, thumbnailUrl: thumbResult.url };
  } catch (error) {
    console.error('Video processing failed:', error);
    throw error;
  }
};
```

### **Step 2: Add Compression Settings UI**
```typescript
// Optional: Let users choose quality
const [compressionLevel, setCompressionLevel] = useState<'high' | 'medium' | 'low'>('medium');

const compressionSettings = {
  high: { quality: 0.9, bitrate: 2000, resolution: [720, 1280] },
  medium: { quality: 0.7, bitrate: 1000, resolution: [720, 1280] },
  low: { quality: 0.5, bitrate: 500, resolution: [480, 854] }
};
```

## 💰 Cost Savings Estimation

### **Storage Costs (Supabase)**
- **Before**: 100MB × 1000 videos = 100GB
- **After**: 15MB × 1000 videos = 15GB
- **Savings**: 85% reduction in storage costs

### **Bandwidth Costs**
- **Before**: 100MB download per video view
- **After**: 15MB download per video view
- **Savings**: 85% reduction in bandwidth costs

## 🔧 Alternative Libraries

### **Option A: expo-video-processing**
```bash
npx expo install expo-video-processing
```
- ✅ Native Expo integration
- ✅ Good compression ratios
- ❌ Limited customization

### **Option B: react-native-ffmpeg**
```bash
npm install react-native-ffmpeg
```
- ✅ Full FFmpeg power
- ✅ Maximum customization
- ❌ Larger app size
- ❌ More complex setup

### **Option C: Cloud Processing**
```bash
# Use Cloudinary or similar service
npm install cloudinary-react-native
```
- ✅ Server-side processing
- ✅ Advanced features
- ❌ Additional service costs
- ❌ Network dependency

## 📱 Mobile-Specific Considerations

### **iOS Optimizations**
- Use H.264 codec (best iOS support)
- Leverage hardware acceleration
- Test on older devices (iPhone 8+)

### **Android Optimizations**
- Support multiple codecs (H.264, VP9)
- Consider device capabilities
- Test on various Android versions

## 🧪 Testing Strategy

### **Quality Testing**
1. **Visual Comparison**: Original vs compressed side-by-side
2. **File Size Metrics**: Track compression ratios
3. **Upload Speed**: Measure improvement in upload times
4. **Playback Performance**: Test on various devices

### **A/B Testing**
- Test different compression levels with users
- Monitor engagement metrics
- Measure user satisfaction with video quality

## 🚀 Quick Start Implementation

1. **Install Dependencies**
   ```bash
   npx expo install expo-video-thumbnails
   npm install react-native-video-processing
   ```

2. **Update Upload Function**
   - Add compression before upload
   - Generate thumbnails
   - Show compression progress

3. **Test & Iterate**
   - Start with medium quality settings
   - Monitor user feedback
   - Adjust based on performance metrics

## 📈 Success Metrics

- **File Size Reduction**: Target 70-80% smaller files
- **Upload Speed**: 3-5x faster uploads
- **Storage Costs**: 70-80% reduction
- **User Experience**: Maintain 4+ star ratings
- **Bandwidth**: 70-80% reduction in data usage

## 🔄 Migration Strategy

1. **Phase 1**: Implement for new uploads only
2. **Phase 2**: Batch compress existing videos
3. **Phase 3**: Add adaptive quality based on connection
4. **Phase 4**: Implement server-side processing for advanced features
