import { SessionProvider, useSession } from 'context/AuthenticationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Slot,
  SplashScreen,
  usePathname,
  useRouter,
} from 'expo-router';
import { useColorScheme } from 'components/useColorScheme';
import { PropsWithChildren, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const PUBLIC_AUTH_ROUTES = ['/login', '/forgotPassword'];

function AppLoader({ children }: PropsWithChildren) {
  const [isAppReady, setAppReady] = useState<boolean>(false);
  const { isLoading: isSessionLoading, session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isSessionLoading) {
      setAppReady(true);
    }
  }, [isSessionLoading]);

  useEffect(() => {
    if (!isAppReady) {
      return;
    }
    if (session) {
      if (PUBLIC_AUTH_ROUTES.includes(pathname)) {
        router.replace('/');
      }
    } else if (!PUBLIC_AUTH_ROUTES.includes(pathname)) {
      router.replace('/login');
    }
    void SplashScreen.hideAsync().catch(() => undefined);
  }, [isAppReady, session, pathname, router]);

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
  return <Root />;
}

export default AppEntryPoint;
