import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';

export default function UntisScreen() {
  const webViewRef = useRef<WebView>(null);
  const initialUrl = 'https://neilo.webuntis.com/WebUntis/?school=bbz-rd-eck#/basic/login';
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
        * {
          -webkit-overflow-scrolling: touch !important;
        }
        
        /* Improve scrolling for timetable and lists */
        .timetable-container,
        .grid-container,
        [class*="scroll"],
        [class*="overflow"] {
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
        }

        body {
          font-size: 14px !important;
          zoom: 1.0;
          padding-top: 0 !important;
          margin-top: 0 !important;
        }

        /* Optimize timetable cell sizes for mobile */
        .timetable-cell,
        [class*="gridCell"] {
          min-height: 60px !important;
          padding: 4px !important;
        }

        /* Make text in cells more readable */
        .timetable-cell *,
        [class*="gridCell"] * {
          font-size: 0.9em !important;
          line-height: 1.2 !important;
        }

        /* Improve touch targets */
        button,
        [role="button"],
        .clickable,
        [class*="button"] {
          min-height: 44px !important;
          min-width: 44px !important;
          padding: 10px !important;
        }

        /* Optimize navigation elements */
        .navigation-container,
        [class*="navigation"],
        [class*="toolbar"] {
          height: auto !important;
          min-height: 48px !important;
          padding: 8px !important;
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
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
