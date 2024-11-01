import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View, BackHandler } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

const SCHULCLOUD_URL = 'https://app.schul.cloud';

export default function SchulCloudScreen() {
  const webViewRef = useRef<WebView>(null);
  const orientation = useOrientation();
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const [canGoBack, setCanGoBack] = React.useState(false);

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

  const horizontalSwipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((event) => {
      if (event.translationX > 50) {
        // Swipe right - go back
        webViewRef.current?.goBack();
      } else if (event.translationX < -50) {
        // Swipe left - go forward
        webViewRef.current?.goForward();
      }
    });

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
        .scrollable-content, 
        .messages-container, 
        .channel-list,
        .conversation-list,
        [class*="scroll"],
        [class*="overflow"] {
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
        }
        body {
          padding-top: 0px !important;
          margin-top: 0 !important;
          overscroll-behavior-x: contain !important;
        }

        /* Add transitions for smooth sidebar collapse/expand */
        .sc-channel-list,
        .sc-conversation-list,
        .sc-sidebar,
        [class*="channelList"],
        [class*="conversationList"],
        [class*="sidebar"] {
          transition: width 0.3s ease-in-out !important;
        }

        /* Collapsed state styles */
        .collapsed {
          width: 60px !important;
          min-width: 60px !important;
        }

        .collapsed * {
          overflow: hidden !important;
          white-space: nowrap !important;
        }
      \`;
      document.head.appendChild(style);

      // Enable back/forward swipe navigation
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
    })();
    true;
  `;
  
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const adjustedStatusBarHeight = orientation === 'landscape' ? statusBarHeight / 3 : statusBarHeight;

  const handleContentProcessDidTerminate = () => {
    webViewRef.current?.reload();
  };

  const handleNavigationStateChange = (navState: { canGoBack: boolean }) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={horizontalSwipe}>
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
          <WebViewNavBar webViewRef={webViewRef} initialUrl={SCHULCLOUD_URL} />
          <WebView 
            ref={webViewRef}
            style={[styles.webview, { backgroundColor }]}
            source={{ uri: SCHULCLOUD_URL }}
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
            allowsBackForwardNavigationGestures={true} // Enable native gestures for iOS
            onNavigationStateChange={handleNavigationStateChange}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'navigationStateChange') {
                  setCanGoBack(data.canGoBack);
                }
              } catch (error) {
                console.error('Error parsing WebView message:', error);
              }
            }}
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
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
