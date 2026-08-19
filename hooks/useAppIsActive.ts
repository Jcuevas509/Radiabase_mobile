import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Tracks whether React Native is actively in the foreground. */
export function useAppIsActive(): boolean {
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    setIsAppActive(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (nextState) => {
      setIsAppActive(nextState === 'active');
    });
    return () => subscription.remove();
  }, []);

  return isAppActive;
}
