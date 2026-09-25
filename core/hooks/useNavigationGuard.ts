import { useCallback, useRef } from 'react';

export function useNavigationGuard() {
  const navigatingRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback(
    async (navigationFn: () => Promise<void> | void) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      try {
        await navigationFn();
      } catch (e) {
        navigatingRef.current = false;
        throw e;
      }
      safetyTimerRef.current = setTimeout(() => {
        navigatingRef.current = false;
        safetyTimerRef.current = null;
      }, 500);
    },
    []
  );

  const reset = useCallback(() => {
    navigatingRef.current = false;
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  return { navigatingRef, safetyTimerRef, navigate, reset };
}
