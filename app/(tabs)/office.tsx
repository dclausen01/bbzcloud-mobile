import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View, BackHandler, Dimensions } from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import { useUrl } from '../../context/UrlContext';
import { useLocalSearchParams } from 'expo-router';

const OFFICE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

export default function OfficeScreen() {
  const webViewRef = useRef<WebView>(null);
  const { urls } = useUrl();
  const orientation = useOrientation();
  const params = useLocalSearchParams<{ url?: string }>();
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const [canGoBack, setCanGoBack] = React.useState(false);

  // Use params.url for initial loading, but keep base wiki URL for home button
  const currentUrl = params.url || urls.office;

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

  const injectedScript = `
    (function() {
      // Chrome version detection override
      const chromeVersion = '121.0.0.0';
      Object.defineProperty(window, 'chrome', {
        enumerable: true,
        writable: true,
        value: {
          runtime: {},
          webstore: {},
          app: {},
          loadTimes: function() {},
          csi: function() {},
          app: {
            isInstalled: false,
          },
        },
      });

      // Override browser detection methods
      const navigatorProps = {
        userAgent: '${OFFICE_USER_AGENT}',
        appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        platform: 'Win64',
        vendor: 'Google Inc.',
        language: 'de-DE',
        languages: ['de-DE', 'de', 'en-US', 'en'],
        hardwareConcurrency: 8,
        deviceMemory: 8,
        maxTouchPoints: 5,
        connection: {
          downlink: 10,
          effectiveType: "4g",
          rtt: 50,
          saveData: false
        }
      };

      // Override navigator properties
      Object.defineProperties(navigator, {
        ...Object.getOwnPropertyDescriptors(navigatorProps),
        webdriver: { get: () => undefined },
      });

      // Add comprehensive WebRTC support
      if (!window.RTCPeerConnection) {
        window.RTCPeerConnection = class RTCPeerConnection {
          constructor() {
            this.localDescription = null;
            this.remoteDescription = null;
            this.signalingState = 'stable';
            this.iceGatheringState = 'complete';
            this.iceConnectionState = 'connected';
            this.connectionState = 'connected';
          }
          createOffer() { return Promise.resolve({}); }
          createAnswer() { return Promise.resolve({}); }
          setLocalDescription() { return Promise.resolve(); }
          setRemoteDescription() { return Promise.resolve(); }
          addIceCandidate() { return Promise.resolve(); }
          getStats() { return Promise.resolve({}); }
        };
      }

      // Add comprehensive media devices support
      if (!navigator.mediaDevices) {
        navigator.mediaDevices = {
          enumerateDevices: () => Promise.resolve([
            { deviceId: 'default', kind: 'audioinput', label: 'Default Audio Input', groupId: '' },
            { deviceId: 'default', kind: 'audiooutput', label: 'Default Audio Output', groupId: '' },
            { deviceId: 'default', kind: 'videoinput', label: 'Default Video Input', groupId: '' }
          ]),
          getUserMedia: (constraints) => Promise.resolve({
            getTracks: () => [{
              enabled: true,
              id: 'mock-track-id',
              kind: constraints.video ? 'video' : 'audio',
              label: constraints.video ? 'Mock Video Track' : 'Mock Audio Track',
              stop: () => {}
            }]
          }),
          getSupportedConstraints: () => ({
            aspectRatio: true,
            deviceId: true,
            echoCancellation: true,
            facingMode: true,
            frameRate: true,
            height: true,
            width: true,
            sampleRate: true,
            sampleSize: true,
            volume: true
          })
        };
      }

      // Add permissions API
      if (!navigator.permissions) {
        navigator.permissions = {
          query: () => Promise.resolve({ state: 'granted' })
        };
      }

      const style = document.createElement('style');
      style.textContent = \`
        /* General optimizations */
        * {
          -webkit-overflow-scrolling: touch !important;
          touch-action: manipulation !important;
        }

        /* Improve text readability */
        body, p, div, span, li {
          line-height: 1.4 !important;
          margin-bottom: 0.5em !important;
          font-size: 14px !important;
        }

        /* Heading adjustments */
        h1, h2, h3, h4, h5, h6 {
          line-height: 1.2 !important;
          margin-top: 0.8em !important;
          margin-bottom: 0.4em !important;
        }

        h1 { font-size: 20px !important; }
        h2 { font-size: 18px !important; }
        h3 { font-size: 16px !important; }
        h4 { font-size: 15px !important; }

        /* List spacing */
        ul, ol {
          margin: 0.5em 0 !important;
          padding-left: 1.5em !important;
        }

        li {
          margin-bottom: 0.3em !important;
        }

        /* Improve button and control sizes */
        button, 
        [role="button"],
        .ms-Button,
        .office-button {
          min-height: 36px !important;
          min-width: 36px !important;
          padding: 8px !important;
        }

        /* Improve text input fields */
        input[type="text"],
        input[type="email"],
        input[type="password"] {
          font-size: 14px !important;
          padding: 8px !important;
          line-height: 1.3 !important;
        }

        /* Document content spacing */
        .DocumentCanvas,
        .WordCanvas,
        .ExcelCanvas,
        .PowerPointCanvas {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 8px !important;
        }

        /* Paragraph spacing in documents */
        .Document p,
        .WordDocument p {
          margin-bottom: 0.6em !important;
          line-height: 1.4 !important;
        }

        /* Enhanced scrolling support */
        .scrollable-content, 
        .document-container,
        .ribbon-container,
        [class*="scroll"],
        [class*="overflow"] {
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
        }

        /* Tablet-specific styles when in landscape mode */
        @media (min-width: 768px) and (orientation: landscape) {
          .main-content {
            max-width: none !important;
            margin: 0 auto !important;
          }
          
          .ribbon {
            height: auto !important;
            overflow-x: auto !important;
          }

          /* Slightly larger text for tablets */
          body, p, div, span, li {
            font-size: 15px !important;
          }
        }

        /* Ensure video elements are properly sized */
        video {
          max-width: 100% !important;
          height: auto !important;
        }

        /* Office-specific optimizations */
        .office-ribbon {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }

        .office-contextual-menu {
          touch-action: manipulation !important;
        }

        /* Table spacing */
        table {
          margin: 0.8em 0 !important;
          border-spacing: 1px !important;
        }

        td, th {
          padding: 6px !important;
          line-height: 1.3 !important;
        }
      \`;
      document.head.appendChild(style);

      // Add viewport meta tag
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);

      // Override platform detection
      Object.defineProperty(navigator, 'platform', {
        get: function() { return 'Win32'; }
      });
      // Force links to open in same tab
      window.open = function(url) {
        window.location.href = url;
        return null;
      };

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
    <View style={[styles.container, { backgroundColor }]}>
      {Platform.OS === 'android' && (
        <View style={[{ height: statusBarHeight, backgroundColor }]} />
      )}
      <WebViewNavBar webViewRef={webViewRef} initialUrl={urls.office} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: currentUrl }}
        injectedJavaScript={injectedScript}
        userAgent={OFFICE_USER_AGENT}
        scrollEnabled={true}
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
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        sharedCookiesEnabled={true}
        javaScriptCanOpenWindowsAutomatically={true}
        mixedContentMode="compatibility"
        webviewDebuggingEnabled={true}
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
