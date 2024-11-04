import { Stack } from 'expo-router';
import { UrlProvider } from '../context/UrlContext';
import { TutorialProvider } from '../context/TutorialContext';
import { CustomAppsProvider } from '../context/CustomAppsContext';
import { Tutorial } from '../components/Tutorial';
import { useTutorial } from '../context/TutorialContext';

function RootLayoutContent() {
  const { showTutorial } = useTutorial();
  
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {showTutorial && <Tutorial />}
    </>
  );
}

export default function RootLayout() {
  return (
    <UrlProvider>
      <TutorialProvider>
        <CustomAppsProvider>
          <RootLayoutContent />
        </CustomAppsProvider>
      </TutorialProvider>
    </UrlProvider>
  );
}
