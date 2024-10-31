import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import * as Linking from 'expo-linking';

import { useColorScheme } from '../hooks/useColorScheme';
import { TutorialProvider } from '../context/TutorialContext';
import { Tutorial } from '../components/Tutorial';
import { useTutorial } from '../context/TutorialContext';
import { UrlProvider, useUrl } from '../context/UrlContext';
import { getTabFromUrl } from '../utils/urlHandler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { showTutorial } = useTutorial();
  const { setUrl } = useUrl();

  useEffect(() => {
    // Handle URLs when the app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url) {
        const tabInfo = getTabFromUrl(url);
        if (tabInfo) {
          setUrl(tabInfo.tab, url);
          router.push(tabInfo.route);
        }
      }
    });

    // Handle URLs when the app is not running and is opened via URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        const tabInfo = getTabFromUrl(url);
        if (tabInfo) {
          setUrl(tabInfo.tab, url);
          router.push(tabInfo.route);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [setUrl]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {showTutorial && <Tutorial />}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <UrlProvider>
      <TutorialProvider>
        <RootLayoutNav />
      </TutorialProvider>
    </UrlProvider>
  );
}
