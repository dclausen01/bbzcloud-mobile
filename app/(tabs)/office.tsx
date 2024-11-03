import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View, BackHandler } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import { useUrl } from '../../context/UrlContext';
import { useLocalSearchParams } from 'expo-router';

const OFFICE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

export default function OfficeScreen() {
  const webViewRef = useRef<WebView>(null);
  const { urls } = useUrl();
  const orientation = useOrientation();
  const params = useLocalSearchParams<{ url?: string }>();
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const [canGoBack, setCanGoBack] = React.useState(false);

  // Use params.url for initial loading, but keep base wiki URL for home button
  const currentUrl = params.url || urls.office;

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const injectedScript = `
    (function() {
      const style = document.createElement('style');
      style.textContent = \`
        /* General optimizations */
        * {
          -webkit-overflow-scrolling: touch !important;
          touch-action: manipulation !important;
        }

        /* Improve button and control sizes */
        button, 
        [role="button"],
        .ms-Button,
        .office-button {
          min-height: 44px !important;
          min-width: 44px !important;
          padding: 12px !important;
        }

        /* Improve text input fields */
        input[type="text"],
        input[type="email"],
        input[type="password"] {
          font-size: 16px !important;
          padding: 12px !important;
        }

        /* Optimize document view */
        .DocumentCanvas,
        .WordCanvas,
        .ExcelCanvas,
        .PowerPointCanvas {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      \`;
      document.head.appendChild(style);

      // Add viewport meta tag
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);

      // Override platform detection
      Object.defineProperty(navigator, 'platform', {
        get: function() { return 'Win32'; }
      });
      // Force links to open in same tab
      window.open = function(url) {
        window.location.href = url;
        return null;
      };
    })();
    true;
  `;

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const adjustedStatusBarHeight = orientation === 'landscape' ? statusBarHeight / 3 : statusBarHeight;

  const handleContentProcessDidTerminate = () => {
    webViewRef.current?.reload();
  };

  const handleNavigationStateChange = (navState: { canGoBack: boolean }) => {
    setCanGoBack(navState.canGoBack);
  };
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {Platform.OS === 'android' && (
        <View style={[{ height: statusBarHeight, backgroundColor }]} />
      )}
      <WebViewNavBar webViewRef={webViewRef} initialUrl={urls.office} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: currentUrl }}
        injectedJavaScript={injectedScript}
        userAgent={OFFICE_USER_AGENT}
        scrollEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        incognito={false}
        onContentProcessDidTerminate={handleContentProcessDidTerminate}
        androidLayerType="hardware"
        pullToRefreshEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsBackForwardNavigationGestures={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        sharedCookiesEnabled={true}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'navigationStateChange') {
              setCanGoBack(data.canGoBack);
            }
          } catch (error) {
            console.error('Error parsing WebView message:', error);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarSpace: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  statusBarSpaceLandscape: {
    height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) / 2 : 0,
  },
  webview: {
    flex: 1,
  },
});
