import { Stack } from 'expo-router';
import { UrlProvider } from '../context/UrlContext';
import { TutorialProvider } from '../context/TutorialContext';
import { CustomAppsProvider } from '../context/CustomAppsContext';
import { Tutorial } from '../components/Tutorial';
import { useTutorial } from '../context/TutorialContext';
import { View } from 'react-native';

function RootLayoutContent() {
  const { showTutorial } = useTutorial();
  
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {showTutorial && <Tutorial />}
    </View>
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
