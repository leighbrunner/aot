import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ImageErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ImageErrorBoundary caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper to use hooks
interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.errorContainer }]}>
      <MaterialIcons 
        name="error-outline" 
        size={48} 
        color={theme.colors.onErrorContainer} 
      />
      <Text 
        variant="titleMedium" 
        style={[styles.title, { color: theme.colors.onErrorContainer }]}
      >
        Something went wrong
      </Text>
      <Text 
        variant="bodyMedium" 
        style={[styles.message, { color: theme.colors.onErrorContainer }]}
      >
        {error?.message || 'An unexpected error occurred while loading the image'}
      </Text>
      <Button 
        mode="contained" 
        onPress={onReset}
        style={styles.button}
        buttonColor={theme.colors.error}
        textColor={theme.colors.onError}
      >
        Try Again
      </Button>
    </View>
  );
}

// Export the wrapper component
export default function ImageErrorBoundary(props: Props) {
  return <ImageErrorBoundaryClass {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    minWidth: 120,
  },
});