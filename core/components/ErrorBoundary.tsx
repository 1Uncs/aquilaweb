import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { spacing, radius } from '@/constants/tokens';
import Colors from '@/constants/colors';
import { formatError } from '@/core/utils/formatError';

type State = { hasError: boolean; error: Error | null };

export class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
          <ThemedText variant="h2" style={{ marginBottom: spacing.md, color: Colors.light.error }}>
            Something went wrong
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
            {formatError(this.state.error)}
          </ThemedText>
          <Pressable onPress={this.handleRetry} style={[styles.retryBtn, { backgroundColor: Colors.light.primary }]}>
            <ThemedText variant="label" style={{ color: '#fff', textAlign: 'center' }}>
              Try Again
            </ThemedText>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  retryBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
});
