import { lazy, ComponentType } from 'react';
import { Platform } from 'react-native';

// Lazy loading for screens - only works on web
export const lazyLoadScreen = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): T => {
  if (Platform.OS === 'web') {
    return lazy(importFunc) as T;
  }
  // For native platforms, return a component that imports synchronously
  let Component: T;
  importFunc().then(module => {
    Component = module.default;
  });
  return ((props: any) => {
    if (!Component) {
      // Return a loading placeholder while the component loads
      const { ActivityIndicator, View } = require('react-native');
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    return <Component {...props} />;
  }) as T;
};

// Admin screens - lazy loaded since they're not used by regular users
export const AdminDashboard = lazyLoadScreen(() => 
  import('../../admin/screens/AdminDashboard').then(m => ({ default: m.default }))
);

export const ImageReview = lazyLoadScreen(() => 
  import('../../admin/screens/ImageReview').then(m => ({ default: m.default }))
);

export const CategoryManagement = lazyLoadScreen(() => 
  import('../../admin/screens/CategoryManagement').then(m => ({ default: m.default }))
);

export const AnalyticsOverview = lazyLoadScreen(() => 
  import('../../admin/screens/AnalyticsOverview').then(m => ({ default: m.default }))
);

export const AnalyticsDashboard = lazyLoadScreen(() => 
  import('../../admin/screens/AnalyticsDashboard').then(m => ({ default: m.default }))
);

export const AIGeneration = lazyLoadScreen(() => 
  import('../../admin/screens/AIGeneration').then(m => ({ default: m.default }))
);

export const ContentPipeline = lazyLoadScreen(() => 
  import('../../admin/screens/ContentPipeline').then(m => ({ default: m.default }))
);

// Heavy components that can be lazy loaded
export const StatsScreen = lazyLoadScreen(() => 
  import('../../screens/StatsScreen').then(m => ({ default: m.default }))
);

export const LeaderboardScreen = lazyLoadScreen(() => 
  import('../../screens/LeaderboardScreen').then(m => ({ default: m.default }))
);

// Chart components - only load when needed
export const VotingHeatmap = lazyLoadScreen(() => 
  import('../../components/VotingHeatmap').then(m => ({ default: m.default }))
);

export const PreferenceChart = lazyLoadScreen(() => 
  import('../../components/PreferenceChart').then(m => ({ default: m.default }))
);