import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';

export default function WikiScreen() {
  const webViewRef = useRef<WebView>(null);
  const initialUrl = 'https://wiki.bbz-rd-eck.com';
  const orientation = useOrientation();
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';

  const injectedScript = `
    (function() {
      // Add meta viewport tag for proper scaling
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=0.95, maximum-scale=0.95, user-scalable=no';
      document.head.appendChild(meta);

      const style = document.createElement('style');
      style.textContent = \`
        body {
          padding-top: 0 !important;
          margin-top: 0 !important;
          font-size: 1.1em !important;
        }
        /* Adjust text sizes */
        p, div, span, li {
          font-size: 1.05em !important;
        }
        /* Keep form elements slightly smaller for better usability */
        td, th, input, button {
          font-size: 1.05em !important;
        }
        /* Slightly smaller headings */
        h1 { font-size: 1.1em !important; }
        h2 { font-size: 1.2em !important; }
        h3 { font-size: 1.15em !important; }
        h4 { font-size: 1.1em !important; }
      \`;
      document.head.appendChild(style);
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
    elevation: 0,
  },
  webview: {
    flex: 1,
  },
});
