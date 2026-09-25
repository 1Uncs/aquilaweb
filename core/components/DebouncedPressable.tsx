import { useRef, useCallback } from 'react';
import { Pressable, PressableProps, GestureResponderEvent } from 'react-native';

const DEBOUNCE_MS = 300;

type DebouncedPressableProps = {
  onPress: () => void;
  debounceMs?: number;
  disabled?: boolean;
  style?: PressableProps['style'];
  testID?: string;
  children: React.ReactNode;
  onPressIn?: ((_event: GestureResponderEvent) => void) | null | undefined;
  onPressOut?: ((_event: GestureResponderEvent) => void) | null | undefined;
} & Omit<PressableProps, 'onPress' | 'style' | 'children' | 'onPressIn' | 'onPressOut'>;

export function DebouncedPressable({
  onPress,
  debounceMs = DEBOUNCE_MS,
  disabled = false,
  style,
  testID,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: DebouncedPressableProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef(false);

  const handlePress = useCallback(() => {
    if (disabled || pressedRef.current) return;
    pressedRef.current = true;
    onPress();
    timerRef.current = setTimeout(() => {
      pressedRef.current = false;
      timerRef.current = null;
    }, debounceMs);
  }, [onPress, debounceMs, disabled]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={style}
      testID={testID}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
