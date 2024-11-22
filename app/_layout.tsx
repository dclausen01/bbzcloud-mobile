import { Stack } from 'expo-router';
import { UrlProvider } from '../context/UrlContext';
import { TutorialProvider } from '../context/TutorialContext';
import { CustomAppsProvider } from '../context/CustomAppsContext';
import { NetworkProvider, useNetwork } from '../context/NetworkContext';
import { Tutorial } from '../components/Tutorial';
import { NetworkError } from '../components/NetworkError';
import { useTutorial } from '../context/TutorialContext';
import { View } from 'react-native';

function RootLayoutContent() {
  const { showTutorial } = useTutorial();
  const { isConnected, checkConnection } = useNetwork();
  
  // Only show content if we have confirmed network status and are connected
  // or if we're not connected, show the network error
  return (
    <View style={{ flex: 1 }}>
      {isConnected === false ? (
        <NetworkError onRetry={checkConnection} />
      ) : (
        <>
          <Stack screenOptions={{ headerShown: false }} />
          {showTutorial && <Tutorial />}
        </>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <NetworkProvider>
      <UrlProvider>
        <TutorialProvider>
          <CustomAppsProvider>
            <RootLayoutContent />
          </CustomAppsProvider>
        </TutorialProvider>
      </UrlProvider>
    </NetworkProvider>
  );
}
