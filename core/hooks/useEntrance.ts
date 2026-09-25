import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { animation, spring } from '@/constants/tokens';

type EntranceOptions = {
  delay?: number;
  translateY?: number;
  duration?: number;
  tension?: number;
  friction?: number;
};

/**
 * Native-driver entrance: opacity fades with timing, translateY springs.
 * Mount-only — returns animated style to spread onto Animated.View.
 */
export function useEntrance(options: EntranceOptions = {}) {
  const {
    delay = 0,
    translateY = 16,
    duration = animation.normal,
    tension = spring.gentle.tension,
    friction = spring.gentle.friction,
  } = options;

  const opacity = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(translateY)).current;

  useEffect(() => {
    const fade = Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    });
    const rise = Animated.spring(offset, {
      toValue: 0,
      tension,
      friction,
      delay,
      useNativeDriver: true,
    });
    const batch = Animated.parallel([fade, rise]);
    batch.start();
    return () => batch.stop();
  }, [opacity, offset, delay, duration, tension, friction]);

  return { opacity, transform: [{ translateY: offset }] };
}
