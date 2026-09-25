import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import Colors from '@/constants/colors';
import { spacing, radius, border } from '@/constants/tokens';

type ToastMessage = {
  id: string;
  text: string;
  type: 'info' | 'error' | 'success';
};

type ToastContextValue = {
  showToast: (text: string, type?: 'info' | 'error' | 'success') => void;
};

const pendingQueue: Array<{ text: string; type: 'info' | 'error' | 'success' }> = [];
let mountedInstance: ((text: string, type?: 'info' | 'error' | 'success') => void) | null = null;

export function requestToast(text: string, type: 'info' | 'error' | 'success' = 'info') {
  if (mountedInstance) {
    mountedInstance(text, type);
  } else {
    pendingQueue.push({ text, type });
  }
}

export const ToastContext = React.createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const drainingRef = useRef(false);

  const showToast = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  React.useEffect(() => {
    mountedInstance = showToast;
  }, [showToast]);

  React.useEffect(() => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    while (pendingQueue.length > 0) {
      const { text, type } = pendingQueue.shift()!;
      showToast(text, type);
    }
    return () => {
      mountedInstance = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.container, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
        {toasts.map((toast) => (
          <View
            key={toast.id}
            style={[
              styles.toast,
              { backgroundColor: colors.surface, borderColor: colors.border },
              toast.type === 'error' && { borderColor: colors.error },
              toast.type === 'success' && { borderColor: colors.success },
            ]}
          >
            <Text style={[styles.text, { color: colors.text }]}>{toast.text}</Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toast: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: border.thin,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
