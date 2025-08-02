import { Platform } from 'react-native';
import { InteractionManager } from 'react-native';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
}

export interface PerformanceReport {
  screenLoadTime?: number;
  apiCallDuration?: number;
  imageLoadTime?: number;
  memoryUsage?: number;
  fps?: number;
  bundleSize?: number;
  cacheHitRate?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private report: PerformanceReport = {};
  private isEnabled: boolean = __DEV__;

  /**
   * Start timing an operation
   */
  startTimer(name: string) {
    if (!this.isEnabled) return;
    this.timers.set(name, Date.now());
  }

  /**
   * End timing and record the metric
   */
  endTimer(name: string, unit: 'ms' | 'bytes' | 'count' = 'ms') {
    if (!this.isEnabled) return;
    
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return;
    }

    const duration = Date.now() - startTime;
    this.recordMetric(name, duration, unit);
    this.timers.delete(name);
    
    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms') {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Update report
    this.updateReport(name, value);
  }

  /**
   * Track screen load time
   */
  trackScreenLoad(screenName: string, callback: () => void) {
    if (!this.isEnabled) {
      callback();
      return;
    }

    this.startTimer(`screen_load_${screenName}`);
    
    InteractionManager.runAfterInteractions(() => {
      const loadTime = this.endTimer(`screen_load_${screenName}`);
      if (loadTime) {
        this.report.screenLoadTime = loadTime;
        console.log(`Screen ${screenName} loaded in ${loadTime}ms`);
      }
      callback();
    });
  }

  /**
   * Track API call performance
   */
  async trackAPICall<T>(name: string, apiCall: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) {
      return apiCall();
    }

    this.startTimer(`api_${name}`);
    try {
      const result = await apiCall();
      const duration = this.endTimer(`api_${name}`);
      if (duration) {
        this.report.apiCallDuration = duration;
      }
      return result;
    } catch (error) {
      this.endTimer(`api_${name}`);
      throw error;
    }
  }

  /**
   * Track image load time
   */
  trackImageLoad(imageUrl: string) {
    if (!this.isEnabled) return;

    const startTime = Date.now();
    
    return {
      onLoadEnd: () => {
        const loadTime = Date.now() - startTime;
        this.recordMetric('image_load', loadTime);
        this.report.imageLoadTime = loadTime;
      },
      onError: () => {
        this.recordMetric('image_load_error', 1, 'count');
      },
    };
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    return { ...this.report };
  }

  /**
   * Get recent metrics
   */
  getMetrics(limit: number = 10): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    this.timers.clear();
    this.report = {};
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Log performance summary
   */
  logSummary() {
    if (!this.isEnabled) return;

    console.log('=== Performance Summary ===');
    console.log('Report:', this.report);
    console.log('Recent Metrics:', this.getMetrics(5));
    
    // Calculate averages
    const avgByName = new Map<string, { total: number; count: number }>();
    this.metrics.forEach(metric => {
      const existing = avgByName.get(metric.name) || { total: 0, count: 0 };
      existing.total += metric.value;
      existing.count += 1;
      avgByName.set(metric.name, existing);
    });

    console.log('Averages:');
    avgByName.forEach((data, name) => {
      console.log(`  ${name}: ${(data.total / data.count).toFixed(2)}ms`);
    });
  }

  /**
   * Monitor FPS (Web only)
   */
  startFPSMonitoring() {
    if (!this.isEnabled || Platform.OS !== 'web') return;

    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        this.recordMetric('fps', fps, 'count');
        this.report.fps = fps;
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Track memory usage (if available)
   */
  trackMemoryUsage() {
    if (!this.isEnabled || Platform.OS !== 'web') return;

    // @ts-ignore - performance.memory is not in TS types
    if (performance.memory) {
      // @ts-ignore
      const used = performance.memory.usedJSHeapSize;
      // @ts-ignore
      const total = performance.memory.totalJSHeapSize;
      
      this.recordMetric('memory_usage', used, 'bytes');
      this.report.memoryUsage = used;
      
      console.log(`Memory: ${(used / 1024 / 1024).toFixed(2)}MB / ${(total / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  private updateReport(name: string, value: number) {
    // Update specific report fields based on metric name
    if (name.startsWith('screen_load_')) {
      this.report.screenLoadTime = value;
    } else if (name.startsWith('api_')) {
      this.report.apiCallDuration = value;
    } else if (name === 'image_load') {
      this.report.imageLoadTime = value;
    } else if (name === 'fps') {
      this.report.fps = value;
    } else if (name === 'memory_usage') {
      this.report.memoryUsage = value;
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export convenience functions
export const startTimer = (name: string) => performanceMonitor.startTimer(name);
export const endTimer = (name: string) => performanceMonitor.endTimer(name);
export const trackScreenLoad = (screenName: string, callback: () => void) => 
  performanceMonitor.trackScreenLoad(screenName, callback);
export const trackAPICall = <T>(name: string, apiCall: () => Promise<T>) => 
  performanceMonitor.trackAPICall(name, apiCall);
export const trackImageLoad = (imageUrl: string) => performanceMonitor.trackImageLoad(imageUrl);