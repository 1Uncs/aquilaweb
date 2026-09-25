import { useRef, useEffect, useCallback } from 'react';
import { Animated, GestureResponderEvent } from 'react-native';
import { spring } from '@/constants/tokens';

type PressScaleOptions = {
  toValue?: number;
  tension?: number;
  friction?: number;
  pressOutDelay?: number;
};

export function usePressScale(options: PressScaleOptions = {}) {
  const { toValue = 0.97, tension = spring.bouncy.tension, friction = spring.bouncy.friction, pressOutDelay = 80 } = options;

  const scale = useRef(new Animated.Value(1)).current;
  const isPressing = useRef(false);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };
  }, []);

  const animateTo = useCallback(
    (target: number, velocity = 0) => {
      Animated.spring(scale, {
        toValue: target,
        velocity,
        tension,
        friction,
        useNativeDriver: true,
      }).start();
    },
    [scale, tension, friction],
  );

  const onPressIn = useCallback(
    (_e?: GestureResponderEvent) => {
      if (isPressing.current) return;
      isPressing.current = true;
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      animateTo(toValue, 0.8);
    },
    [animateTo, toValue],
  );

  const onPressOut = useCallback(
    (_e?: GestureResponderEvent) => {
      isPressing.current = false;
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      safetyTimer.current = setTimeout(() => {
        animateTo(1, 0.5);
      }, pressOutDelay);
    },
    [animateTo, pressOutDelay],
  );

  return { scale, onPressIn, onPressOut };
}
