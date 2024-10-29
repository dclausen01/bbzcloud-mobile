import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, useColorScheme, View } from 'react-native';
import React, { useRef } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';

export default function SchulCloudScreen() {
  const webViewRef = useRef<WebView>(null);
  const initialUrl = 'https://app.schul.cloud';
  const orientation = useOrientation();
  const isDarkMode = useColorScheme() === 'dark';
  
  // Verwende solide Farben statt transparenter Farben
  const backgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';

  const injectedScript = `
    (function() {
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
          padding-top: 0 !important;
          margin-top: 0 !important;
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
      
      // Rest of your injectedScript code remains the same
    })();
    true;
  `;

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const adjustedStatusBarHeight = orientation === 'landscape' ? statusBarHeight / 3 : statusBarHeight;

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
      <WebViewNavBar webViewRef={webViewRef} initialUrl={initialUrl} />
      <WebView 
        ref={webViewRef}
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: initialUrl }}
        injectedJavaScript={injectedScript}
        scrollEnabled={true}
        bounces={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    elevation: 0,
  },
  webview: {
    flex: 1,
  },
});