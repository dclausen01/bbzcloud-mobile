import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View, BackHandler, Dimensions, ActivityIndicator } from 'react-native';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

const OFFICE_URL = 'https://www.microsoft365.com/?auth=2';
const CHROME_USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const WINDOWS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const screenSize = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
  return screenSize >= 750;
};

interface WebViewError {
  nativeEvent: {
    code: string;
    description: string;
    url: string;
  };
}

export default function OfficeScreen() {
  const webViewRef = useRef<WebView>(null);
  const orientation = useOrientation();
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const [canGoBack, setCanGoBack] = React.useState(false);
  const [currentUserAgent, setCurrentUserAgent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getUserAgent = () => {
    return isTablet() && orientation === 'landscape' ? WINDOWS_USER_AGENT : CHROME_USER_AGENT;
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOffline(!state.isConnected);
    });

    return () => {
      unsubscribe();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const newUserAgent = getUserAgent();
    if (newUserAgent !== currentUserAgent) {
      setCurrentUserAgent(newUserAgent);
      if (webViewRef.current && currentUserAgent !== '') {
        setIsLoading(true);
        webViewRef.current.reload();
      }
    }
  }, [orientation]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  }, []);

  const handleLoadEnd = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsLoading(false);
  }, []);

  const handleError = useCallback((syntheticEvent: WebViewError) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error:', nativeEvent);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsLoading(false);
  }, []);

  const injectedScript = `
    (function() {
      // Handle offline/online events
      window.addEventListener('online', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'connectionChange', isOnline: true }));
      });
      
      window.addEventListener('offline', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'connectionChange', isOnline: false }));
      });

      // Office 365 specific optimizations
      const style = document.createElement('style');
      style.textContent = \`
        /* General mobile optimizations */
        * {
          -webkit-overflow-scrolling: touch !important;
          touch-action: manipulation !important;
        }

        /* Improve button and control sizes for touch */
        button, 
        [role="button"],
        .ms-Button,
        .office-button {
          min-height: 44px !important;
          min-width: 44px !important;
          padding: 12px !important;
          touch-action: manipulation !important;
        }

        /* Optimize Office UI for mobile */
        .o365cs-base,
        .o365sx-navbar,
        .o365cs-nav-header {
          height: auto !important;
          min-height: 48px !important;
        }

        /* Improve text input fields */
        input[type="text"],
        input[type="email"],
        input[type="password"] {
          font-size: 16px !important; /* Prevents iOS zoom on focus */
          padding: 12px !important;
        }

        /* Optimize document view */
        .DocumentCanvas,
        .WordCanvas,
        .ExcelCanvas,
        .PowerPointCanvas {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Responsive layout adjustments */
        @media (max-width: 768px) {
          .ms-CommandBar {
            height: auto !important;
            flex-wrap: wrap !important;
          }

          .ms-CommandBar-primaryCommand {
            flex-wrap: wrap !important;
          }
        }

        /* Tablet optimizations */
        @media (min-width: 768px) and (max-width: 1024px) {
          .ms-CommandBar-item {
            padding: 0 8px !important;
          }
        }
      \`;
      document.head.appendChild(style);

      // Add viewport meta tag for better mobile support
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);

      // Override browser detection methods
      const navigatorProps = {
        userAgent: '${getUserAgent()}',
        appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        platform: '${isTablet() && orientation === 'landscape' ? 'Win64' : 'Android'}',
        vendor: 'Google Inc.',
        language: 'de-DE',
        languages: ['de-DE', 'de', 'en-US', 'en'],
      };

      Object.defineProperties(navigator, {
        ...Object.getOwnPropertyDescriptors(navigatorProps),
        webdriver: { get: () => undefined },
      });

      // Handle authentication persistence
      if (document.cookie.includes('office_auth')) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'authStatus', 
          isAuthenticated: true 
        }));
      }

      // Navigation state handling
      history.pushState = new Proxy(history.pushState, {
        apply: (target, thisArg, argumentsList) => {
          const result = target.apply(thisArg, argumentsList);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'navigationStateChange',
            canGoBack: window.history.length > 1,
            canGoForward: window.history.length > 1
          }));
          return result;
        },
      });

      // Signal that the script has finished loading
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scriptLoaded' }));
    })();
    true;
  `;

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const adjustedStatusBarHeight = orientation === 'landscape' ? statusBarHeight / 3 : statusBarHeight;

  const handleContentProcessDidTerminate = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  const handleNavigationStateChange = useCallback((navState: { canGoBack: boolean }) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'navigationStateChange') {
        setCanGoBack(data.canGoBack);
      } else if (data.type === 'connectionChange') {
        setIsOffline(!data.isOnline);
      } else if (data.type === 'scriptLoaded') {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {Platform.OS === 'android' && (
        <View style={[{ height: adjustedStatusBarHeight, backgroundColor }]} />
      )}
      <WebViewNavBar webViewRef={webViewRef} initialUrl={OFFICE_URL} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: OFFICE_URL }}
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
        allowsBackForwardNavigationGestures={true}
        onNavigationStateChange={handleNavigationStateChange}
        userAgent={getUserAgent()}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        javaScriptCanOpenWindowsAutomatically={true}
        mixedContentMode="compatibility"
        webviewDebuggingEnabled={true}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        decelerationRate="normal"
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
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
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
