import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, View } from 'react-native';
import React, { useRef } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';

export default function UntisScreen() {
  const webViewRef = useRef<WebView>(null);
  const initialUrl = 'https://neilo.webuntis.com/WebUntis/?school=bbz-rd-eck#/basic/login';
  const orientation = useOrientation();

  const injectedScript = `
    (function() {
      // Add meta viewport tag for proper scaling
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);

      // Add custom styles for better visibility
      const style = document.createElement('style');
      style.textContent = \`
        body {
          font-size: 14px !important;
          zoom: 1.0;
          padding-top: 10px !important;
        }
        
        /* Increase text size in specific elements */
        .table td, 
        .table th,
        input,
        button,
        select,
        .form-control,
        .btn,
        label,
        span,
        div {
          font-size: 14px !important;
        }

        /* Make clickable elements bigger */
        button,
        .btn,
        input[type="button"],
        input[type="submit"] {
          min-height: 36px !important;
          padding: 8px 12px !important;
        }

        /* Adjust table cell padding */
        .table td, 
        .table th {
          padding: 8px 6px !important;
        }
      \`;
      document.head.appendChild(style);

      // Function to periodically check and apply styles to dynamic content
      function applyStylesToNewElements() {
        const elements = document.querySelectorAll('td, th, input, button, select, .form-control, .btn, label, span');
        elements.forEach(elem => {
          if (elem.style.fontSize !== '14px') {
            elem.style.fontSize = '14px';
          }
        });
      }

      // Apply styles every second to catch dynamic content
      setInterval(applyStylesToNewElements, 1000);
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
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        injectedJavaScript={injectedScript}
        scrollEnabled={true}
        bounces={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        textZoom={110}
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
