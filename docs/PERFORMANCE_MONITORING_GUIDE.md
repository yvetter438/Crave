# 📊 Performance Monitoring & Memory Leak Detection Guide

## 🎯 **Overview**

Video apps like Crave are particularly susceptible to performance issues due to:
- **Heavy video processing**
- **Large memory usage** 
- **Complex navigation stacks**
- **Real-time data updates**

This guide covers tools and techniques to monitor and debug performance issues during development.

---

## 🛠️ **Built-in React Native Tools**

### **1. React Native Performance Monitor**

#### **Enable in Development:**
```javascript
// In your app's index.js or App.tsx
if (__DEV__) {
  import('./ReactotronConfig').then(() => console.log('Reactotron Configured'))
}

// Enable performance monitor
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings(['Warning: ...']);
```

#### **Access Performance Monitor:**
- **iOS Simulator**: `Cmd + D` → "Perf Monitor"
- **Android Emulator**: `Cmd + M` → "Perf Monitor" 
- **Physical Device**: Shake device → "Perf Monitor"

#### **Metrics Shown:**
- **RAM usage** (MB)
- **JSC Heap** (JavaScript memory)
- **Views** (number of native views)
- **FPS** (frames per second)

### **2. React DevTools Profiler**

#### **Installation:**
```bash
npm install --save-dev react-devtools
```

#### **Usage:**
```bash
# Start React DevTools
npx react-devtools

# In your app, enable profiling
import { enableScreens } from 'react-native-screens';
enableScreens();
```

#### **What It Shows:**
- **Component render times**
- **Re-render frequency** 
- **Props changes**
- **Memory usage per component**

---

## 📱 **Platform-Specific Tools**

### **iOS Development**

#### **1. Xcode Instruments**
```bash
# Open your project in Xcode
cd ios && xcode-select --install
open Crave.xcworkspace

# Run with Instruments:
# Product → Profile → Choose Template
```

**Key Instruments for Video Apps:**
- **Leaks**: Detect memory leaks
- **Allocations**: Track memory usage over time
- **Time Profiler**: Find performance bottlenecks
- **Core Animation**: Measure FPS and rendering
- **Energy Log**: Battery usage analysis

#### **2. Memory Graph Debugger**
```bash
# In Xcode while app is running:
# Debug → View Memory → Memory Graph Hierarchy
```

**Shows:**
- **Memory usage by object type**
- **Retain cycles** (circular references)
- **Leaked objects**
- **Memory growth over time**

#### **3. iOS Simulator Performance**
```bash
# Enable slow animations for testing
# Simulator → Debug → Slow Animations

# Check memory warnings
# Simulator → Device → Simulate Memory Warning
```

### **Android Development**

#### **1. Android Studio Profiler**
```bash
# Open Android Studio
# View → Tool Windows → Profiler
# Select your running app
```

**Profiler Sections:**
- **Memory Profiler**: Heap dumps, memory allocation
- **CPU Profiler**: Method tracing, CPU usage
- **Network Profiler**: API calls, data usage
- **Energy Profiler**: Battery impact

#### **2. ADB Commands**
```bash
# Monitor memory usage
adb shell dumpsys meminfo com.crave.social

# Monitor CPU usage  
adb shell top -p $(adb shell pidof com.crave.social)

# Force garbage collection
adb shell am force-stop com.crave.social
```

#### **3. Chrome DevTools for React Native**
```bash
# Enable remote debugging
# Shake device → "Debug with Chrome"
# Open Chrome → chrome://inspect
```

---

## 🔧 **Third-Party Monitoring Tools**

### **1. Flipper (Meta's Debugging Platform)**

#### **Installation:**
```bash
npm install --save-dev react-native-flipper
cd ios && pod install
```

#### **Setup:**
```javascript
// In App.tsx
import { useEffect } from 'react';

if (__DEV__) {
  import('react-native-flipper').then(({default: Flipper}) => {
    Flipper.addPlugin({
      getId() { return 'MyPlugin'; },
      onConnect(connection) {
        // Monitor memory usage
        setInterval(() => {
          connection.send('memoryUsage', {
            jsHeap: performance.memory?.usedJSHeapSize || 0,
            timestamp: Date.now()
          });
        }, 1000);
      },
      onDisconnect() {},
      runInBackground() { return false; }
    });
  });
}
```

#### **Features:**
- **Network inspector**
- **Database browser** 
- **Performance metrics**
- **Custom plugins**
- **Real-time monitoring**

### **2. Reactotron**

#### **Installation:**
```bash
npm install --save-dev reactotron-react-native
npm install --save-dev reactotron-redux # if using Redux
```

#### **Setup:**
```javascript
// ReactotronConfig.js
import Reactotron from 'reactotron-react-native';

if (__DEV__) {
  Reactotron
    .configure({ name: 'Crave App' })
    .useReactNative({
      asyncStorage: false,
      networking: {
        ignoreUrls: /symbolicate/
      },
      editor: false,
      errors: { veto: (stackFrame) => false },
      overlay: false,
    })
    .connect();
}

export default Reactotron;
```

#### **Features:**
- **API call monitoring**
- **State management tracking**
- **Performance benchmarking**
- **Custom logging**

### **3. Sentry Performance Monitoring**

#### **Installation:**
```bash
npm install @sentry/react-native
cd ios && pod install
```

#### **Setup:**
```javascript
// In App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN_HERE',
  enableAutoSessionTracking: true,
  tracesSampleRate: 1.0,
});

// Wrap your app
export default Sentry.wrap(App);
```

#### **Custom Performance Tracking:**
```javascript
// Track video performance
const transaction = Sentry.startTransaction({
  name: 'video-playback',
  op: 'navigation'
});

// Track memory usage
Sentry.addBreadcrumb({
  message: 'Memory usage',
  level: 'info',
  data: {
    memoryUsage: performance.memory?.usedJSHeapSize
  }
});

transaction.finish();
```

---

## 📊 **Custom Performance Monitoring**

### **1. Memory Usage Tracker**

```javascript
// utils/PerformanceMonitor.js
class PerformanceMonitor {
  constructor() {
    this.memoryReadings = [];
    this.isMonitoring = false;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.interval = setInterval(() => {
      this.recordMemoryUsage();
    }, 1000);
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  recordMemoryUsage() {
    const memory = performance.memory;
    const reading = {
      timestamp: Date.now(),
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0
    };
    
    this.memoryReadings.push(reading);
    
    // Keep only last 100 readings
    if (this.memoryReadings.length > 100) {
      this.memoryReadings.shift();
    }
    
    // Alert if memory usage is high
    if (reading.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
      console.warn('High memory usage detected:', reading);
    }
  }

  getMemoryReport() {
    return {
      currentUsage: this.memoryReadings[this.memoryReadings.length - 1],
      averageUsage: this.calculateAverage(),
      peakUsage: Math.max(...this.memoryReadings.map(r => r.usedJSHeapSize)),
      readings: this.memoryReadings
    };
  }

  calculateAverage() {
    const sum = this.memoryReadings.reduce((acc, r) => acc + r.usedJSHeapSize, 0);
    return sum / this.memoryReadings.length;
  }
}

export default new PerformanceMonitor();
```

### **2. Video Performance Tracker**

```javascript
// utils/VideoPerformanceTracker.js
class VideoPerformanceTracker {
  constructor() {
    this.videoMetrics = new Map();
  }

  startVideoTracking(videoId) {
    this.videoMetrics.set(videoId, {
      startTime: Date.now(),
      loadTime: null,
      playTime: null,
      errors: [],
      memoryAtStart: performance.memory?.usedJSHeapSize || 0
    });
  }

  recordVideoLoaded(videoId) {
    const metrics = this.videoMetrics.get(videoId);
    if (metrics) {
      metrics.loadTime = Date.now() - metrics.startTime;
    }
  }

  recordVideoPlaying(videoId) {
    const metrics = this.videoMetrics.get(videoId);
    if (metrics) {
      metrics.playTime = Date.now() - metrics.startTime;
    }
  }

  recordVideoError(videoId, error) {
    const metrics = this.videoMetrics.get(videoId);
    if (metrics) {
      metrics.errors.push({
        timestamp: Date.now(),
        error: error.message || error
      });
    }
  }

  getVideoReport(videoId) {
    return this.videoMetrics.get(videoId);
  }

  getAllVideoReports() {
    return Array.from(this.videoMetrics.entries()).map(([id, metrics]) => ({
      videoId: id,
      ...metrics
    }));
  }
}

export default new VideoPerformanceTracker();
```

### **3. Component Performance Hook**

```javascript
// hooks/usePerformanceMonitor.js
import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (__DEV__) {
      console.log(`[${componentName}] Render #${renderCount.current}, Time since last: ${timeSinceLastRender}ms`);
      
      // Warn about frequent re-renders
      if (timeSinceLastRender < 100 && renderCount.current > 5) {
        console.warn(`[${componentName}] Frequent re-renders detected!`);
      }
    }
  });

  useEffect(() => {
    return () => {
      const totalTime = Date.now() - mountTime.current;
      if (__DEV__) {
        console.log(`[${componentName}] Unmounted after ${totalTime}ms, ${renderCount.current} renders`);
      }
    };
  }, []);

  return {
    renderCount: renderCount.current,
    timeSinceMounted: Date.now() - mountTime.current
  };
};
```

---

## 🎬 **Video-Specific Performance Testing**

### **1. Video Memory Leak Detection**

```javascript
// In VideoPost.tsx, add monitoring
import PerformanceMonitor from '../utils/PerformanceMonitor';
import VideoPerformanceTracker from '../utils/VideoPerformanceTracker';

export default function VideoPost({ post, activePostId, shouldPlay }) {
  useEffect(() => {
    // Start tracking this video
    VideoPerformanceTracker.startVideoTracking(post.id);
    
    return () => {
      // Log performance when component unmounts
      const report = VideoPerformanceTracker.getVideoReport(post.id);
      console.log('Video Performance Report:', report);
    };
  }, [post.id]);

  // Monitor memory during video playback
  useEffect(() => {
    if (shouldPlay) {
      PerformanceMonitor.startMonitoring();
    } else {
      PerformanceMonitor.stopMonitoring();
    }
  }, [shouldPlay]);
}
```

### **2. Feed Performance Testing**

```javascript
// Test script for feed performance
const testFeedPerformance = async () => {
  const startMemory = performance.memory?.usedJSHeapSize || 0;
  const startTime = Date.now();
  
  // Simulate scrolling through 50 videos
  for (let i = 0; i < 50; i++) {
    // Trigger video load/unload cycle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check memory every 10 videos
    if (i % 10 === 0) {
      const currentMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = currentMemory - startMemory;
      
      console.log(`Video ${i}: Memory increase: ${memoryIncrease / 1024 / 1024}MB`);
      
      // Alert if memory increased by more than 100MB
      if (memoryIncrease > 100 * 1024 * 1024) {
        console.error('Potential memory leak detected!');
        break;
      }
    }
  }
  
  const endTime = Date.now();
  const endMemory = performance.memory?.usedJSHeapSize || 0;
  
  return {
    totalTime: endTime - startTime,
    memoryIncrease: endMemory - startMemory,
    averageTimePerVideo: (endTime - startTime) / 50
  };
};
```

---

## 🚨 **Common Performance Issues & Detection**

### **1. Memory Leaks**

#### **Symptoms:**
- App becomes slower over time
- Crashes with "out of memory" errors
- High memory usage in profiler

#### **Detection:**
```javascript
// Add to App.tsx
if (__DEV__) {
  setInterval(() => {
    const memory = performance.memory?.usedJSHeapSize || 0;
    if (memory > 200 * 1024 * 1024) { // 200MB threshold
      console.error('High memory usage detected:', memory / 1024 / 1024, 'MB');
    }
  }, 5000);
}
```

#### **Common Causes in Video Apps:**
- Video players not properly disposed
- Event listeners not removed
- Timers not cleared
- Large image/video caches

### **2. Performance Bottlenecks**

#### **Symptoms:**
- Choppy scrolling
- Slow video loading
- UI freezing

#### **Detection:**
```javascript
// FPS monitor
let lastTime = performance.now();
let frameCount = 0;

function measureFPS() {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    const fps = frameCount;
    frameCount = 0;
    lastTime = currentTime;
    
    if (fps < 30) {
      console.warn('Low FPS detected:', fps);
    }
  }
  
  requestAnimationFrame(measureFPS);
}

if (__DEV__) {
  measureFPS();
}
```

### **3. Network Performance**

#### **Monitor API Calls:**
```javascript
// Network performance tracker
const originalFetch = global.fetch;
global.fetch = async (...args) => {
  const startTime = Date.now();
  const response = await originalFetch(...args);
  const endTime = Date.now();
  
  console.log(`API Call: ${args[0]} took ${endTime - startTime}ms`);
  
  return response;
};
```

---

## 📋 **Performance Testing Checklist**

### **Daily Development Testing:**
- [ ] Enable React Native Performance Monitor
- [ ] Check memory usage after 10+ video scrolls
- [ ] Monitor FPS during heavy interactions
- [ ] Test on low-end devices
- [ ] Check for console warnings/errors

### **Weekly Deep Testing:**
- [ ] Run Xcode Instruments (iOS)
- [ ] Use Android Studio Profiler
- [ ] Test memory usage over 30+ minutes
- [ ] Profile video loading performance
- [ ] Check for memory leaks with Flipper

### **Pre-Release Testing:**
- [ ] Full performance audit with all tools
- [ ] Test on oldest supported devices
- [ ] Stress test with 100+ video scrolls
- [ ] Monitor battery usage
- [ ] Test with poor network conditions

---

## 🎯 **Performance Targets for Video Apps**

### **Memory Usage:**
- **Startup**: < 50MB
- **Normal usage**: < 150MB
- **Heavy usage**: < 300MB
- **Peak usage**: < 500MB

### **Performance:**
- **FPS**: Maintain 60fps during scrolling
- **Video load time**: < 2 seconds
- **App startup**: < 3 seconds
- **Navigation**: < 500ms transitions

### **Battery:**
- **Video playback**: < 10% battery per hour
- **Background usage**: < 1% per hour

---

## 🔧 **Automated Performance Testing**

### **Jest Performance Tests:**
```javascript
// __tests__/performance.test.js
describe('Performance Tests', () => {
  test('VideoPost component renders within time limit', async () => {
    const startTime = Date.now();
    
    render(<VideoPost post={mockPost} />);
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(100); // 100ms limit
  });

  test('Memory usage stays within limits', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Render 10 video components
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(<VideoPost post={mockPost} />);
      unmount();
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB limit
  });
});
```

This comprehensive guide should help you monitor and optimize your app's performance throughout development!
