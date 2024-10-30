import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';

export default function MoodleScreen() {
  const webViewRef = useRef<WebView>(null);
  const initialUrl = 'https://portal.bbz-rd-eck.com/';
  const orientation = useOrientation();
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';

  const injectedScript = `
    (function() {
      const style = document.createElement('style');
      style.textContent = \`
        body {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
      \`;
      document.head.appendChild(style);

      // Request notification permission
      if ('Notification' in window) {
        Notification.requestPermission().then(function(permission) {
          if (permission === 'granted') {
            console.log('Notification permission granted');
          }
        });
      }
    })();
    true;
  `;
  
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const adjustedStatusBarHeight = orientation === 'landscape' ? statusBarHeight / 3 : statusBarHeight;

  const handleContentProcessTerminate = () => {
    webViewRef.current?.reload();
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor }
    ]}>
      {Platform.OS === 'android' && (
        <View 
          style={[
            { height: adjustedStatusBarHeight, backgroundColor }
          ]} 
        />
      )}
      <WebViewNavBar webViewRef={webViewRef} initialUrl={initialUrl} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: initialUrl }}
        injectedJavaScript={injectedScript}
        scrollEnabled={true}
        bounces={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        incognito={false}
        onContentProcessDidTerminate={handleContentProcessTerminate}
        androidLayerType="hardware"
        pullToRefreshEnabled={true}
        thirdPartyCookiesEnabled={true}
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
