import { Stack } from 'expo-router';
import { UrlProvider } from '../context/UrlContext';
import { TutorialProvider } from '../context/TutorialContext';
import { CustomAppsProvider } from '../context/CustomAppsContext';

export default function RootLayout() {
  return (
    <UrlProvider>
      <TutorialProvider>
        <CustomAppsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </CustomAppsProvider>
      </TutorialProvider>
    </UrlProvider>
  );
}
