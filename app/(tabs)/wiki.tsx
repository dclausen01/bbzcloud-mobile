import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import { useUrl } from '../../context/UrlContext';

export default function WikiScreen() {
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
          line-height: 1.3 !important;
        }

        /* Improve text readability */
        p, li, td, th {
          font-size: 16px !important;
          line-height: 1.3 !important;
          margin-bottom: 8px !important;
        }

        /* Better headings */
        h1, h2, h3, h4, h5, h6 {
          margin: 24px 0 16px 0 !important;
          line-height: 1.2 !important;
          font-weight: 600 !important;
        }
        h1 { font-size: 28px !important; }
        h2 { font-size: 24px !important; }
        h3 { font-size: 20px !important; }
        h4 { font-size: 18px !important; }
      

        /* Make links more touch-friendly */
        a {
          padding: 4px 2px !important;
          margin: 2px !important;
          touch-action: manipulation !important;
        }

        /* Improve tables */
        table {
          width: 100% !important;
          margin: 16px 0 !important;
          border-collapse: collapse !important;
        }

        td, th {
          padding: 12px !important;
          border: 1px solid #ddd !important;
        }

        /* Better code blocks */
        pre, code {
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace !important;
          font-size: 14px !important;
          padding: 16px !important;
          margin: 16px 0 !important;
          border-radius: 8px !important;
          background-color: ${isDarkMode ? '#2C2C2E' : '#f5f5f5'} !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }

        /* Improve lists */
        ul, ol {
          padding-left: 24px !important;
          margin: 16px 0 !important;
        }

        li {
          margin: 8px 0 !important;
        }

        /* Better images */
        img {
          max-width: 100% !important;
          height: auto !important;
          margin: 16px 0 !important;
          border-radius: 8px !important;
        }

        /* Improve navigation */
        nav, .navigation, .menu {
          padding: 12px !important;
        }

        nav a, .navigation a, .menu a {
          display: inline-block !important;
          padding: 12px !important;
          margin: 4px !important;
          min-height: 44px !important;
          min-width: 44px !important;
        }

        /* Better blockquotes */
        blockquote {
          margin: 16px 0 !important;
          padding: 12px 24px !important;
          border-left: 4px solid #007AFF !important;
          background-color: ${isDarkMode ? '#2C2C2E' : '#f5f5f5'} !important;
        }

        /* Ensure proper touch scrolling */
        .content, 
        .main-content,
        article,
        .article-content {
          -webkit-overflow-scrolling: touch !important;
          overflow-y: auto !important;
        }
      \`;
      document.head.appendChild(style);
      document.getElementById('dw__title').style.fontSize = '60%';
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
  }, [urls.wiki]);

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
      <WebViewNavBar webViewRef={webViewRef} initialUrl={urls.wiki} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: urls.wiki }}
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
