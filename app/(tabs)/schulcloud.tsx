import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View, BackHandler, Dimensions, Alert } from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

  // Handle file downloads
  const handleFileDownload = async (url: string, filename: string) => {
    try {
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Create a unique filename in the cache directory
      const downloadPath = `${FileSystem.cacheDirectory}${filename}`;

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(url, downloadPath);

      if (downloadResult.status === 200) {
        // Share the downloaded file
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/octet-stream',
          dialogTitle: `Share ${filename}`,
          UTI: 'public.item' // Required for iOS
        });
      } else {
        Alert.alert('Error', 'Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
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

      // Track all download attempts
      function detectDownload(url, filename) {
        console.log('Download detected:', url, filename);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'download',
          url: url,
          filename: filename || url.split('/').pop() || 'download'
        }));
        return false;
      }

      // Monitor DOM changes for iframe creation
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'IFRAME') {
              const iframe = node;
              const iframeSrc = iframe.src;
              if (iframeSrc) {
                // Check if the iframe src is a downloadable file
                if (/\\.(pdf|doc|docx|xls|xlsx|zip|rar|7z|txt|jpg|jpeg|png|gif)$/i.test(iframeSrc)) {
                  console.log('Iframe download detected:', iframeSrc);
                  detectDownload(iframeSrc);
                  // Remove the iframe to prevent the default download behavior
                  iframe.remove();
                }
              }
            }
          });
        });
      });

      // Start observing the document with the configured parameters
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });

      // Override createElement to catch iframe creation
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        if (tagName.toLowerCase() === 'iframe') {
          const originalSetAttribute = element.setAttribute;
          element.setAttribute = function(name, value) {
            if (name === 'src' && /\\.(pdf|doc|docx|xls|xlsx|zip|rar|7z|txt|jpg|jpeg|png|gif)$/i.test(value)) {
              console.log('Prevented iframe download:', value);
              detectDownload(value);
              return;
            }
            originalSetAttribute.call(this, name, value);
          };
        }
        return element;
      };

      // Intercept click events on download links
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href) {
          const url = link.href;
          // Check various download indicators
          if (
            link.hasAttribute('download') || // HTML5 download attribute
            url.includes('/download/') ||    // URL contains download path
            url.includes('/files/') ||       // URL contains files path
            link.dataset.download ||         // Custom download data attribute
            link.classList.contains('download-link') || // Download CSS class
            link.getAttribute('type')?.includes('application/') || // MIME type indicates file
            /\\.(pdf|doc|docx|xls|xlsx|zip|rar|7z|txt|jpg|jpeg|png|gif)$/i.test(url) // File extension
          ) {
            e.preventDefault();
            detectDownload(url, link.download || link.getAttribute('filename'));
          }
        }
      }, true);

      // Intercept form submissions that might trigger downloads
      document.addEventListener('submit', function(e) {
        const form = e.target;
        if (
          form.getAttribute('action')?.includes('/download/') ||
          form.getAttribute('action')?.includes('/files/') ||
          form.dataset.download
        ) {
          e.preventDefault();
          const formData = new FormData(form);
          const url = new URL(form.action);
          formData.forEach((value, key) => url.searchParams.append(key, value.toString()));
          detectDownload(url.toString(), form.dataset.filename);
        }
      }, true);

      // Override XMLHttpRequest to detect download headers
      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        xhr.open = function() {
          const url = arguments[1];
          const method = arguments[0];
          
          xhr.addEventListener('readystatechange', function() {
            if (xhr.readyState === xhr.HEADERS_RECEIVED) {
              const contentDisposition = xhr.getResponseHeader('Content-Disposition');
              const contentType = xhr.getResponseHeader('Content-Type');
              
              if (
                contentDisposition?.includes('attachment') ||
                contentType?.includes('application/') ||
                contentType?.includes('binary/')
              ) {
                xhr.abort();
                detectDownload(url, contentDisposition?.split('filename=')[1]?.replace(/["']/g, ''));
              }
            }
          });
          
          originalOpen.apply(xhr, arguments);
        };
        return xhr;
      };

      // Override fetch to detect download responses
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        return originalFetch(input, init).then(response => {
          const contentDisposition = response.headers.get('Content-Disposition');
          const contentType = response.headers.get('Content-Type');
          
          if (
            contentDisposition?.includes('attachment') ||
            contentType?.includes('application/') ||
            contentType?.includes('binary/')
          ) {
            const url = typeof input === 'string' ? input : input.url;
            detectDownload(url, contentDisposition?.split('filename=')[1]?.replace(/["']/g, ''));
            throw new Error('Download intercepted');
          }
          return response;
        });
      };

      // Override navigator properties
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

      Object.defineProperties(navigator, {
        ...Object.getOwnPropertyDescriptors(navigatorProps),
        webdriver: { get: () => undefined },
      });

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

      if (!navigator.permissions) {
        navigator.permissions = {
          query: () => Promise.resolve({ state: 'granted' })
        };
      }

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

        .sc-channel-list,
        .sc-conversation-list,
        .sc-sidebar,
        [class*="channelList"],
        [class*="conversationList"],
        [class*="sidebar"] {
          transition: width 0.3s ease-in-out !important;
        }

        .collapsed {
          width: 60px !important;
          min-width: 60px !important;
        }

        .collapsed * {
          overflow: hidden !important;
          white-space: nowrap !important;
        }

        video {
          max-width: 100% !important;
          height: auto !important;
        }

        audio {
          width: 100% !important;
          max-width: 600px !important;
        }

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

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'navigationStateChange') {
        setCanGoBack(data.canGoBack);
      } else if (data.type === 'download') {
        handleFileDownload(data.url, data.filename);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
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
        onMessage={handleMessage}
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
