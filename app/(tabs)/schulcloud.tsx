import { WebView, WebViewNavigation } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View, BackHandler, Dimensions } from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';

const SCHULCLOUD_URL = 'https://app.schul.cloud';
const CHROME_USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const WINDOWS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// Function to detect if device is a tablet based on screen size
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const screenSize = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
  return screenSize >= 750;
};

export default function SchulCloudScreen() {
  const webViewRef = useRef<WebView>(null);
  const orientation = useOrientation();
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const [canGoBack, setCanGoBack] = React.useState(false);
  const [currentUserAgent, setCurrentUserAgent] = useState('');

  // Determine which user agent to use
  const getUserAgent = () => {
    if (isTablet() && orientation === 'landscape') {
      return WINDOWS_USER_AGENT;
    }
    return CHROME_USER_AGENT;
  };

  // Update user agent when orientation changes
  useEffect(() => {
    const newUserAgent = getUserAgent();
    if (newUserAgent !== currentUserAgent) {
      setCurrentUserAgent(newUserAgent);
      if (webViewRef.current && currentUserAgent !== '') {
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
        userAgent: '${getUserAgent()}',
        appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        platform: '${isTablet() && orientation === 'landscape' ? 'Win64' : 'Android'}',
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

      // Add viewport meta tag for better tablet support
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
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

        /* Ensure video elements are properly sized and positioned */
        video {
          max-width: 100% !important;
          height: auto !important;
        }

        /* Ensure audio elements are properly styled */
        audio {
          width: 100% !important;
          max-width: 600px !important;
        }

        /* Tablet-specific styles when in landscape mode */
        @media (min-width: 768px) and (orientation: landscape) {
          .main-content {
            max-width: none !important;
            margin: 0 auto !important;
          }
          
          .sidebar {
            width: 280px !important;
          }
        }
      \`;
      document.head.appendChild(style);

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

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
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
        allowsBackForwardNavigationGestures={true}
        onNavigationStateChange={handleNavigationStateChange}
        userAgent={getUserAgent()}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        javaScriptCanOpenWindowsAutomatically={true}
        mixedContentMode="compatibility"
        webviewDebuggingEnabled={true}
        setSupportMultipleWindows={true}
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
