import React, { Component, ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorCount: number;
}

class VotingErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('VotingErrorBoundary caught error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to analytics/monitoring service in production
    if (__DEV__ === false) {
      // TODO: Send to error tracking service
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
    });
    this.props.onRetry?.();
  };

  handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      // If expo-updates is not available, reload the page on web
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <VotingErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorCount={this.state.errorCount}
          onReset={this.handleReset}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

// Functional component for the error UI
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: any;
  errorCount: number;
  onReset: () => void;
  onReload: () => void;
}

function VotingErrorFallback({ 
  error, 
  errorInfo, 
  errorCount,
  onReset, 
  onReload 
}: ErrorFallbackProps) {
  const theme = useTheme();
  const isDevelopment = __DEV__;

  const getErrorMessage = () => {
    if (error?.message.includes('Network')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    if (error?.message.includes('Image')) {
      return 'Failed to load images. The images may be temporarily unavailable.';
    }
    return 'An unexpected error occurred. Please try again.';
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name="error-outline" 
              size={64} 
              color={theme.colors.error} 
            />
          </View>
          
          <Text 
            variant="headlineMedium" 
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Oops! Something went wrong
          </Text>
          
          <Text 
            variant="bodyLarge" 
            style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
          >
            {getErrorMessage()}
          </Text>

          {errorCount > 2 && (
            <Card style={[styles.warningCard, { backgroundColor: theme.colors.warningContainer }]}>
              <Card.Content>
                <Text 
                  variant="bodyMedium" 
                  style={{ color: theme.colors.onWarningContainer }}
                >
                  Multiple errors detected. If this persists, try reloading the app.
                </Text>
              </Card.Content>
            </Card>
          )}

          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={onReset}
              style={styles.button}
              icon="refresh"
            >
              Try Again
            </Button>
            
            {errorCount > 1 && (
              <Button 
                mode="outlined" 
                onPress={onReload}
                style={styles.button}
                icon="restart"
              >
                Reload App
              </Button>
            )}
          </View>

          {isDevelopment && error && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.debugContainer}>
                <Text 
                  variant="titleSmall" 
                  style={[styles.debugTitle, { color: theme.colors.error }]}
                >
                  Debug Information
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={[styles.debugText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {error.name}: {error.message}
                </Text>
                {errorInfo?.componentStack && (
                  <ScrollView 
                    horizontal 
                    style={styles.stackTrace}
                    showsHorizontalScrollIndicator={true}
                  >
                    <Text 
                      variant="bodySmall" 
                      style={[styles.stackTraceText, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {errorInfo.componentStack}
                    </Text>
                  </ScrollView>
                )}
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

// Export the wrapper component
export default function VotingErrorBoundary(props: Props) {
  return <VotingErrorBoundaryClass {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginTop: 40,
    borderRadius: 16,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  warningCard: {
    marginBottom: 20,
    borderRadius: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginVertical: 6,
  },
  divider: {
    marginVertical: 24,
  },
  debugContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  },
  debugTitle: {
    marginBottom: 8,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  stackTrace: {
    marginTop: 8,
    maxHeight: 100,
  },
  stackTraceText: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
});