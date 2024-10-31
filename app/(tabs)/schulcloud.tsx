import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import { useUrl } from '../../context/UrlContext';

export default function SchulCloudScreen() {
  const webViewRef = useRef<WebView>(null);
  const { urls } = useUrl();
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

        /* Target specific schul.cloud elements */
        .sc-messenger-content,
        .sc-messenger-sidebar,
        .sc-messenger-list,
        .sc-messenger-channels,
        .sc-messenger-conversations,
        .messenger-content,
        .messenger-sidebar,
        .messenger-list,
        .messenger-channels,
        .messenger-conversations,
        div[class*="messenger-content"],
        div[class*="messenger-sidebar"],
        div[class*="messenger-list"],
        div[class*="messenger-channels"],
        div[class*="messenger-conversations"] {
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch !important;
          height: 100% !important;
          max-height: 100vh !important;
          overscroll-behavior: contain !important;
        }

        /* Ensure parent containers don't block scrolling */
        .sc-messenger,
        .messenger,
        .sc-messenger-window,
        .messenger-window,
        div[class*="messenger-window"] {
          height: 100vh !important;
          overflow: hidden !important;
        }
      \`;
      document.head.appendChild(style);

      // Add scroll event listener to prevent body scroll when scrolling channels/conversations
      document.addEventListener('DOMContentLoaded', function() {
        const scrollableElements = document.querySelectorAll('.sc-messenger-content, .sc-messenger-sidebar, .messenger-content, .messenger-sidebar');
        scrollableElements.forEach(element => {
          element.addEventListener('touchmove', function(e) {
            e.stopPropagation();
          }, { passive: true });
        });
      });
    })();
    true;
  `;
  
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const adjustedStatusBarHeight = orientation === 'landscape' ? statusBarHeight / 3 : statusBarHeight;

  const handleContentProcessTerminate = () => {
    webViewRef.current?.reload();
  };

  // Effect to handle URL updates
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, [urls.schulcloud]);

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
      <WebViewNavBar webViewRef={webViewRef} initialUrl={urls.schulcloud} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: urls.schulcloud }}
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
