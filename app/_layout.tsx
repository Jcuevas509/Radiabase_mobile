import { SessionProvider, useSession } from 'context/AuthenticationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Slot,
  SplashScreen,
  useRouter,
} from 'expo-router';
import { useColorScheme } from 'components/useColorScheme';
import { PropsWithChildren, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

function AppLoader({ children }: PropsWithChildren) {
  const [isAppReady, setAppReady] = useState<boolean>(false);
  const { isLoading: isSessionLoading, session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isSessionLoading) {
      setAppReady(true);
    }
  }, [isSessionLoading]);

  useEffect(() => {
    if (isAppReady) {
      if (session) {
        router.replace('/');
      } else {
        router.replace('/login');
      }
      SplashScreen.hideAsync();
    }
  }, [isAppReady, session, router]);

  return (
    <>
      {children}
    </>
  );
}

function Root() {
  const queryClient = new QueryClient();
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AppLoader>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Slot />
            </ThemeProvider>
          </GestureHandlerRootView >
        </AppLoader>
      </SessionProvider>
    </QueryClientProvider>
  );
}

function AppEntryPoint() {
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);
  return <Root />;
}

export default AppEntryPoint;