# Known Issues

Last Updated: August 2025

## Critical Issues

### 1. React Native Web Chart Compatibility
**Status:** 🟡 Workaround Implemented  
**Severity:** Medium  
**Platforms:** Web  
**Description:** react-native-chart-kit doesn't work properly on web platform  
**Workaround:** Created separate web implementation using recharts  
**Permanent Fix:** Planned for v2.0 - Replace with universal charting solution  
**Tracking:** Issue #CHT-001

### 2. Large Image Loading on Low-End Devices
**Status:** 🟡 Partial Fix  
**Severity:** Medium  
**Platforms:** Android (low-end devices)  
**Description:** Images > 2MB cause memory issues on devices with <2GB RAM  
**Workaround:** Implemented progressive loading and size limits  
**Permanent Fix:** Implement dynamic image sizing based on device capabilities  
**Tracking:** Issue #IMG-001

## High Priority Issues

### 3. Offline Vote Synchronization
**Status:** 🟠 In Progress  
**Severity:** High  
**Platforms:** All  
**Description:** Votes queued offline sometimes fail to sync when connection restored  
**Current Behavior:** Manual retry required  
**Expected:** Automatic retry with exponential backoff  
**ETA:** Sprint 15

### 4. Social Login on Expo Go
**Status:** 🔴 Not Fixed  
**Severity:** Low (Development only)  
**Platforms:** iOS/Android (Expo Go)  
**Description:** Social authentication doesn't work in Expo Go development client  
**Workaround:** Test social auth in standalone builds only  
**Note:** This is an Expo Go limitation, not a bug

## Medium Priority Issues

### 5. Gesture Conflicts on Android
**Status:** 🟡 Workaround  
**Severity:** Medium  
**Platforms:** Android  
**Description:** Swipe gestures sometimes conflict with system navigation gestures  
**Workaround:** Reduced swipe sensitivity and added edge detection  
**Tracking:** Issue #GST-001

### 6. Memory Leaks in Image Cache
**Status:** 🟠 Investigating  
**Severity:** Medium  
**Platforms:** iOS  
**Description:** Image cache not properly cleared after extended usage (>1 hour)  
**Symptoms:** App becomes sluggish, increased memory usage  
**Workaround:** App restart clears cache  
**Tracking:** Issue #MEM-001

### 7. Lambda Cold Starts
**Status:** 🟡 Mitigated  
**Severity:** Medium  
**Description:** First API call after inactivity takes 2-3 seconds  
**Mitigation:** Implemented Lambda warmup, reduced to <1 second  
**Permanent Fix:** Consider Lambda SnapStart or containerized functions

## Low Priority Issues

### 8. Dark Mode Inconsistencies
**Status:** 🔴 Not Fixed  
**Severity:** Low  
**Platforms:** All  
**Description:** Some UI elements don't properly adapt to dark mode  
**Affected Components:**
- Modal backgrounds
- Some icon colors
- Chart colors

### 9. Keyboard Avoiding View on iPad
**Status:** 🔴 Not Fixed  
**Severity:** Low  
**Platforms:** iPad  
**Description:** Keyboard avoiding view overcompensates on iPad landscape mode  
**Workaround:** Users can dismiss keyboard manually

### 10. TypeScript Strict Mode
**Status:** 🟠 In Progress  
**Severity:** Low (Technical Debt)  
**Description:** Not all files pass TypeScript strict mode checks  
**Impact:** Potential type safety issues  
**Progress:** 70% complete

## Platform-Specific Issues

### iOS

#### 11. Status Bar Color in Modals
**Status:** 🔴 Won't Fix  
**Severity:** Cosmetic  
**Version:** iOS 15+  
**Description:** Status bar doesn't change color in fullscreen modals  
**Note:** iOS limitation

### Android

#### 12. TextInput Autocorrect
**Status:** 🟡 Workaround  
**Severity:** Low  
**Version:** Android 12+  
**Description:** Autocorrect suggestions overlap with custom dropdown  
**Workaround:** Disabled autocorrect on affected inputs

### Web

#### 13. Safari Private Mode Storage
**Status:** 🟡 Handled  
**Severity:** Medium  
**Browser:** Safari (Private Mode)  
**Description:** LocalStorage not available in Safari private browsing  
**Solution:** Fallback to in-memory storage with warning

## Performance Issues

### 14. Initial Bundle Size
**Status:** 🟠 Optimizing  
**Current:** 4.2MB (gzipped)  
**Target:** <3MB  
**Actions Taken:**
- Code splitting implemented
- Tree shaking enabled
- Lazy loading for screens
**Next Steps:** 
- Remove unused dependencies
- Optimize images

### 15. API Response Times (P95)
**Status:** 🟡 Acceptable  
**Current:** 450ms  
**Target:** <200ms  
**Bottlenecks:**
- DynamoDB queries need optimization
- Consider caching layer

## Security Considerations

### 16. Rate Limiting Bypass
**Status:** 🟢 Fixed  
**Severity:** High  
**Description:** Rate limiting could be bypassed by changing IP  
**Fix:** Implemented user-based rate limiting in addition to IP-based

### 17. Image URL Expiration
**Status:** 🟡 By Design  
**Severity:** Low  
**Description:** Cached image URLs expire after 24 hours  
**Note:** This is intentional for security, app handles gracefully

## Development Issues

### 18. Hot Reload Inconsistencies
**Status:** 🔴 Won't Fix  
**Severity:** Low (Dev only)  
**Description:** Hot reload sometimes requires manual refresh  
**Note:** React Native known issue

### 19. Metro Bundler Memory Usage
**Status:** 🟡 Workaround  
**Severity:** Low (Dev only)  
**Description:** Metro bundler uses excessive memory on large projects  
**Workaround:** Increase Node memory limit: `NODE_OPTIONS=--max_old_space_size=4096`

## Workaround Summary

For developers encountering these issues:

1. **Chart Issues (Web)**: Use AnalyticsOverviewScreen.web.tsx
2. **Social Login (Dev)**: Test in standalone builds
3. **Memory Issues**: Restart app after extended use
4. **Cold Starts**: Implement client-side retry with loading state
5. **Safari Private Mode**: Show warning to users

## Reporting New Issues

When reporting new issues, include:
- Platform and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Device specifications
- Network conditions

Report to: [GitHub Issues](https://github.com/your-org/voting-app/issues)

## Issue Status Legend

- 🟢 Fixed
- 🟡 Workaround Available
- 🟠 In Progress
- 🔴 Not Fixed / Won't Fix