import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import { useUrl } from '../../context/UrlContext';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

export default function MoodleScreen() {
  const webViewRef = useRef<WebView>(null);
  const { urls } = useUrl();
  const orientation = useOrientation();
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';

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
        [class*="scroll"],
        [class*="overflow"] {
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
        }
        body {
          padding-top: 10px !important;
          margin-top: 0 !important;
          overscroll-behavior-x: contain !important;
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
          <WebViewNavBar webViewRef={webViewRef} initialUrl={urls.moodle} />
          <WebView 
            ref={webViewRef}
            style={[styles.webview, { backgroundColor }]}
            source={{ uri: urls.moodle }}
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
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'navigationStateChange') {
                  // Handle navigation state changes
                  console.log('Navigation state changed:', data);
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
