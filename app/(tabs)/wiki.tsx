import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, View } from 'react-native';
import React, { useRef } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';

export default function WikiScreen() {
  const webViewRef = useRef<WebView>(null);
  const initialUrl = 'https://wiki.bbz-rd-eck.com';
  const orientation = useOrientation();

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
          padding-top: 10px !important;
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
        scalesPageToFit={true}
        textZoom={105}
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
