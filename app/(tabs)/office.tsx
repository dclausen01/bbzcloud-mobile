import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import { useUrl } from '../../context/UrlContext';

export default function OfficeScreen() {
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
          -webkit-overflow-scrolling: touch !important;
          font-size: 16px !important;
        }

        /* Improve text readability */
        .ms-font-size-14,
        .ms-font-size-16,
        .ms-font-m,
        .ms-font-l {
          font-size: 16px !important;
          line-height: 1.5 !important;
        }

        /* Make buttons and controls more touch-friendly */
        button,
        [role="button"],
        .ms-Button,
        .ms-CommandBarItem-link,
        .ms-ContextualMenu-link,
        .ms-Nav-link {
          min-height: 44px !important;
          min-width: 44px !important;
          padding: 12px !important;
          margin: 4px !important;
          touch-action: manipulation !important;
        }

        /* Improve ribbon buttons */
        .ms-CommandBar-primaryCommand,
        .ms-CommandBar-secondaryCommand {
          padding: 8px !important;
          margin: 2px !important;
        }

        /* Better spacing for navigation */
        .ms-Nav-groupContent {
          padding: 8px 0 !important;
        }

        /* Improve document list view */
        .ms-DocumentCard {
          margin: 8px !important;
          padding: 12px !important;
        }

        /* Better touch targets for file browser */
        .ms-List-cell,
        .ms-DetailsList-cell {
          min-height: 44px !important;
          padding: 8px !important;
        }

        /* Improve dialog boxes */
        .ms-Dialog-main {
          padding: 16px !important;
        }

        /* Better form controls */
        .ms-TextField-field,
        .ms-ComboBox-Input,
        .ms-SearchBox-field {
          font-size: 16px !important;
          height: 44px !important;
          padding: 8px 12px !important;
        }

        /* Improve context menus */
        .ms-ContextualMenu-item {
          height: 44px !important;
          line-height: 44px !important;
        }

        /* Better scrolling for document content */
        .ms-ScrollablePane,
        .ms-ScrollablePane--contentContainer,
        [role="document"] {
          -webkit-overflow-scrolling: touch !important;
          overflow-y: auto !important;
        }

        /* Improve toolbar icons */
        .ms-CommandBarItem-icon {
          font-size: 20px !important;
        }

        /* Better dropdown menus */
        .ms-Dropdown-items {
          max-height: 400px !important;
          -webkit-overflow-scrolling: touch !important;
        }

        /* Improve file preview */
        .ms-PreviewList {
          padding: 16px !important;
        }

        /* Better touch handling for text selection */
        .ms-SelectionZone {
          touch-action: pan-y pinch-zoom !important;
        }

        /* Improve document editing area */
        .WordCanvas,
        .ExcelCanvas,
        .PowerPointCanvas {
          touch-action: pan-x pan-y pinch-zoom !important;
          -webkit-overflow-scrolling: touch !important;
        }
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

  // Effect to handle URL updates
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, [urls.office]);

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
      <WebViewNavBar webViewRef={webViewRef} initialUrl={urls.office} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: urls.office }}
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
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
