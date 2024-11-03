import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef, useCallback } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';

const OFFICE_URL = 'https://www.microsoft365.com/?auth=2';
const OFFICE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

export default function OfficeScreen() {
  const webViewRef = useRef<WebView>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';

  const handleContentProcessDidTerminate = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

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

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {Platform.OS === 'android' && (
        <View style={[{ height: statusBarHeight, backgroundColor }]} />
      )}
      <WebViewNavBar webViewRef={webViewRef} initialUrl={OFFICE_URL} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: OFFICE_URL }}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  }
});
