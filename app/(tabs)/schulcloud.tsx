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
          height: 100% !important;
        }

        /* Enable touch scrolling globally */
        * {
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
        }

        /* Target messenger container */
        .messenger-window,
        .messenger-component,
        [class*="messenger-window"],
        [class*="messenger-component"] {
          height: 100vh !important;
          max-height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          overflow: hidden !important;
        }

        /* Target sidebar container */
        .messenger-sidebar,
        [class*="messenger-sidebar"],
        .sidebar-container,
        [class*="sidebar-container"] {
          height: 100% !important;
          max-height: 100vh !important;
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
          position: relative !important;
        }

        /* Target main content container */
        .messenger-content,
        [class*="messenger-content"],
        .content-container,
        [class*="content-container"] {
          height: 100% !important;
          max-height: 100vh !important;
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
          position: relative !important;
        }

        /* Target channels list */
        .channels-list,
        [class*="channels-list"],
        .channel-list,
        [class*="channel-list"] {
          height: auto !important;
          max-height: none !important;
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
        }

        /* Target conversations list */
        .conversations-list,
        [class*="conversations-list"],
        .conversation-list,
        [class*="conversation-list"] {
          height: auto !important;
          max-height: none !important;
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
        }

        /* Ensure list items are properly spaced */
        .channel-item,
        .conversation-item,
        [class*="channel-item"],
        [class*="conversation-item"] {
          padding: 12px !important;
          touch-action: pan-y !important;
        }
      \`;
      document.head.appendChild(style);

      // Create a mutation observer to ensure styles are applied to dynamically loaded content
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Only process Element nodes
                const elements = node.querySelectorAll('.messenger-sidebar, .messenger-content, [class*="messenger-sidebar"], [class*="messenger-content"], .channels-list, .conversations-list, [class*="channels-list"], [class*="conversations-list"]');
                elements.forEach(function(element) {
                  element.style.overflowY = 'scroll';
                  element.style.webkitOverflowScrolling = 'touch';
                  element.style.touchAction = 'pan-y';
                });
              }
            });
          }
        });
      });

      // Start observing the document with the configured parameters
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    })();
    true;
  `;
  
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const adjustedStatusBarHeight = orientation === 'landscape' ? statusBarHeight / 3 : statusBarHeight;

  const handleContentProcessDidTerminate = () => {
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
        onContentProcessDidTerminate={handleContentProcessDidTerminate}
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
