import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import { useUrl } from '../../context/UrlContext';

export default function UntisScreen() {
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
        }

        /* Increase base font size */
        * {
          font-size: 18px !important;
          line-height: 1.5 !important;
        }

        /* Specific adjustments for timetable elements */
        .un-timetable-cell,
        .un-timetable-period,
        .un-timetable-subject,
        .un-timetable-room,
        .un-timetable-teacher,
        [class*="timetable-cell"],
        [class*="timetable-period"],
        [class*="timetable-subject"],
        [class*="timetable-room"],
        [class*="timetable-teacher"] {
          font-size: 20px !important;
          line-height: 1.4 !important;
          padding: 8px !important;
        }

        /* Make headers larger */
        h1, .un-header, [class*="header"] {
          font-size: 24px !important;
          font-weight: bold !important;
        }

        /* Increase size of navigation elements */
        .un-navigation,
        .un-menu,
        .un-toolbar,
        [class*="navigation"],
        [class*="menu"],
        [class*="toolbar"] {
          font-size: 20px !important;
        }

        /* Make buttons and interactive elements larger */
        button,
        .un-button,
        [class*="button"],
        select,
        input {
          font-size: 20px !important;
          padding: 12px !important;
          height: auto !important;
        }

        /* Increase size of period times */
        .un-period-time,
        [class*="period-time"] {
          font-size: 20px !important;
          font-weight: bold !important;
        }

        /* Make subject names prominent */
        .un-subject-name,
        [class*="subject-name"] {
          font-size: 22px !important;
          font-weight: bold !important;
        }

        /* Ensure dropdowns and menus are readable */
        .un-dropdown,
        .un-menu-item,
        [class*="dropdown"],
        [class*="menu-item"] {
          font-size: 20px !important;
          padding: 12px !important;
        }

        /* Make table headers clear */
        th, thead td {
          font-size: 20px !important;
          font-weight: bold !important;
        }

        /* Ensure modal content is readable */
        .un-modal,
        [class*="modal"] {
          font-size: 20px !important;
        }
      \`;
      document.head.appendChild(style);
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
  }, [urls.untis]);

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
      <WebViewNavBar webViewRef={webViewRef} initialUrl={urls.untis} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: urls.untis }}
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
