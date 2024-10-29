import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, View } from 'react-native';
import React, { useRef } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';

export default function CryptPadScreen() {
  const webViewRef = useRef<WebView>(null);
  const initialUrl = 'https://cryptpad.fr/drive';
  const orientation = useOrientation();

  const injectedScript = `
    (function() {
      const style = document.createElement('style');
      style.textContent = \`
        body {
          padding-top: 10px !important;
        }
      \`;
      document.head.appendChild(style);
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      <View style={[
        styles.statusBarSpace,
        orientation === 'landscape' ? styles.statusBarSpaceLandscape : null
      ]} />
      <WebViewNavBar webViewRef={webViewRef} initialUrl={initialUrl} />
      <WebView 
        ref={webViewRef}
        style={styles.webview}
        source={{ uri: initialUrl }}
        injectedJavaScript={injectedScript}
        scrollEnabled={true}
        bounces={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBarSpace: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff',
  },
  statusBarSpaceLandscape: {
    height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) / 2 : 0,
  },
  webview: {
    flex: 1,
  },
});
