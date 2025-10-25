#!/usr/bin/env node

/**
 * Quick Performance Monitoring Setup Script
 * Run this to install and configure essential performance monitoring tools
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Performance Monitoring for Crave...\n');

// 1. Install essential performance monitoring packages
console.log('📦 Installing performance monitoring packages...');
try {
  execSync('npm install --save-dev react-devtools reactotron-react-native flipper', { stdio: 'inherit' });
  console.log('✅ Packages installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install packages:', error.message);
}

// 2. Create performance monitoring utility
console.log('🛠️ Creating performance monitoring utilities...');

const performanceMonitorCode = `
// utils/PerformanceMonitor.js
class PerformanceMonitor {
  constructor() {
    this.memoryReadings = [];
    this.isMonitoring = false;
    this.startTime = Date.now();
  }

  startMonitoring() {
    if (this.isMonitoring || !__DEV__) return;
    
    console.log('📊 Starting performance monitoring...');
    this.isMonitoring = true;
    this.interval = setInterval(() => {
      this.recordMetrics();
    }, 2000); // Record every 2 seconds
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    console.log('⏹️ Performance monitoring stopped');
  }

  recordMetrics() {
    const memory = performance.memory;
    const reading = {
      timestamp: Date.now(),
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      timeSinceStart: Date.now() - this.startTime
    };
    
    this.memoryReadings.push(reading);
    
    // Keep only last 50 readings
    if (this.memoryReadings.length > 50) {
      this.memoryReadings.shift();
    }
    
    // Log memory usage in MB
    const memoryMB = (reading.usedJSHeapSize / 1024 / 1024).toFixed(1);
    console.log(\`📊 Memory: \${memoryMB}MB | Time: \${Math.floor(reading.timeSinceStart / 1000)}s\`);
    
    // Alert if memory usage is high
    if (reading.usedJSHeapSize > 200 * 1024 * 1024) { // 200MB
      console.warn('⚠️ High memory usage detected:', memoryMB + 'MB');
    }
  }

  getReport() {
    if (this.memoryReadings.length === 0) return null;
    
    const latest = this.memoryReadings[this.memoryReadings.length - 1];
    const peak = Math.max(...this.memoryReadings.map(r => r.usedJSHeapSize));
    const average = this.memoryReadings.reduce((sum, r) => sum + r.usedJSHeapSize, 0) / this.memoryReadings.length;
    
    return {
      currentMemoryMB: (latest.usedJSHeapSize / 1024 / 1024).toFixed(1),
      peakMemoryMB: (peak / 1024 / 1024).toFixed(1),
      averageMemoryMB: (average / 1024 / 1024).toFixed(1),
      totalReadings: this.memoryReadings.length,
      monitoringDuration: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }

  logReport() {
    const report = this.getReport();
    if (!report) {
      console.log('📊 No performance data available');
      return;
    }
    
    console.log('\\n📊 Performance Report:');
    console.log(\`   Current Memory: \${report.currentMemoryMB}MB\`);
    console.log(\`   Peak Memory: \${report.peakMemoryMB}MB\`);
    console.log(\`   Average Memory: \${report.averageMemoryMB}MB\`);
    console.log(\`   Monitoring Duration: \${report.monitoringDuration}s\\n\`);
  }
}

export default new PerformanceMonitor();
`;

const utilsDir = path.join(process.cwd(), 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir);
}

fs.writeFileSync(path.join(utilsDir, 'PerformanceMonitor.js'), performanceMonitorCode);
console.log('✅ Created utils/PerformanceMonitor.js');

// 3. Create performance hook
const performanceHookCode = `
// hooks/usePerformanceMonitor.js
import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    
    if (__DEV__ && renderCount.current > 10) {
      console.warn(\`⚠️ [\${componentName}] High render count: \${renderCount.current}\`);
    }
  });

  useEffect(() => {
    if (__DEV__) {
      console.log(\`🎬 [\${componentName}] Component mounted\`);
    }
    
    return () => {
      const totalTime = Date.now() - mountTime.current;
      if (__DEV__) {
        console.log(\`🏁 [\${componentName}] Unmounted after \${totalTime}ms, \${renderCount.current} renders\`);
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    timeSinceMounted: Date.now() - mountTime.current
  };
};
`;

const hooksDir = path.join(process.cwd(), 'hooks');
if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir);
}

fs.writeFileSync(path.join(hooksDir, 'usePerformanceMonitor.js'), performanceHookCode);
console.log('✅ Created hooks/usePerformanceMonitor.js');

// 4. Create development performance overlay
const performanceOverlayCode = `
// components/PerformanceOverlay.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PerformanceMonitor from '../utils/PerformanceMonitor';

export default function PerformanceOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!__DEV__) return;
    
    const interval = setInterval(() => {
      setReport(PerformanceMonitor.getReport());
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  if (!__DEV__ || !isVisible || !report) {
    return (
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setIsVisible(!isVisible)}
      >
        <Text style={styles.toggleText}>📊</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setIsVisible(false)}
      >
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Performance Monitor</Text>
      <Text style={styles.metric}>Memory: {report.currentMemoryMB}MB</Text>
      <Text style={styles.metric}>Peak: {report.peakMemoryMB}MB</Text>
      <Text style={styles.metric}>Avg: {report.averageMemoryMB}MB</Text>
      <Text style={styles.metric}>Duration: {report.monitoringDuration}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  toggleText: {
    color: 'white',
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 15,
    borderRadius: 10,
    minWidth: 150,
    zIndex: 9999,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 10,
  },
  closeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metric: {
    color: 'white',
    fontSize: 10,
    marginBottom: 2,
  },
});
`;

const componentsDir = path.join(process.cwd(), 'components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir);
}

fs.writeFileSync(path.join(componentsDir, 'PerformanceOverlay.tsx'), performanceOverlayCode);
console.log('✅ Created components/PerformanceOverlay.tsx');

// 5. Instructions
console.log('\\n🎉 Performance monitoring setup complete!');
console.log('\\n📋 Next Steps:');
console.log('\\n1. Add to your main App component:');
console.log('   import PerformanceMonitor from "./utils/PerformanceMonitor";');
console.log('   import PerformanceOverlay from "./components/PerformanceOverlay";');
console.log('');
console.log('2. Start monitoring in App.tsx:');
console.log('   useEffect(() => {');
console.log('     PerformanceMonitor.startMonitoring();');
console.log('     return () => PerformanceMonitor.stopMonitoring();');
console.log('   }, []);');
console.log('');
console.log('3. Add overlay to your main component:');
console.log('   <PerformanceOverlay />');
console.log('');
console.log('4. Use performance hook in components:');
console.log('   const { renderCount } = usePerformanceMonitor("VideoPost");');
console.log('');
console.log('🚀 You can now monitor memory usage, render counts, and performance!');
console.log('📊 Tap the 📊 button in your app to see real-time metrics.');
`;

fs.writeFileSync(path.join(process.cwd(), 'setup-performance-monitoring.js'), `${performanceOverlayCode}\n\nconsole.log('Performance monitoring setup complete!');`);
console.log('✅ Setup script completed\n');
