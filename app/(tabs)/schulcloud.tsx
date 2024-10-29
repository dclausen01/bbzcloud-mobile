import { WebView } from 'react-native-webview';
import { StyleSheet, Platform, StatusBar, View } from 'react-native';
import React, { useRef } from 'react';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';

export default function SchulCloudScreen() {
  const webViewRef = useRef<WebView>(null);
  const initialUrl = 'https://app.schul.cloud';
  const orientation = useOrientation();

  const injectedScript = `
    (function() {
      // Handle scrolling
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
          padding-top: 10px !important;
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
      
      // Function to handle sidebar collapse/expand
      function handleSidebarVisibility(collapse) {
        const sidebars = document.querySelectorAll('.sc-channel-list, .sc-conversation-list, .sc-sidebar, [class*="channelList"], [class*="conversationList"], [class*="sidebar"]');
        sidebars.forEach(sidebar => {
          if (collapse) {
            sidebar.classList.add('collapsed');
          } else {
            sidebar.classList.remove('collapsed');
          }
        });
      }

      // Set up scroll detection in chat area
      function setupScrollHandler() {
        const chatArea = document.querySelector('.sc-messages-container, [class*="messagesContainer"], [class*="messagesList"]');
        if (chatArea) {
          let scrollTimer;
          chatArea.addEventListener('scroll', () => {
            handleSidebarVisibility(true);
            
            // Expand sidebars after scrolling stops
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
              handleSidebarVisibility(false);
            }, 1500);
          });
        }
      }

      // Set up input detection
      function setupInputHandler() {
        const inputArea = document.querySelector('.sc-message-input, [class*="messageInput"], textarea');
        if (inputArea) {
          inputArea.addEventListener('focus', () => {
            handleSidebarVisibility(true);
          });

          inputArea.addEventListener('blur', () => {
            setTimeout(() => {
              handleSidebarVisibility(false);
            }, 500);
          });
        }
      }

      // Force overflow on dynamic content and set up handlers
      const observer = new MutationObserver(function(mutations) {
        // Handle scrollable elements
        document.querySelectorAll('.scrollable-content, .messages-container, .channel-list, .conversation-list, [class*="scroll"], [class*="overflow"]').forEach(elem => {
          elem.style.overflowY = 'scroll';
          elem.style.webkitOverflowScrolling = 'touch';
          elem.style.touchAction = 'pan-y';
        });

        // Set up handlers if they haven't been set up yet
        setupScrollHandler();
        setupInputHandler();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Initial setup
      setupScrollHandler();
      setupInputHandler();

      // Request notification permission
      if ('Notification' in window) {
        Notification.requestPermission().then(function(permission) {
          if (permission === 'granted') {
            console.log('Notification permission granted');
          }
        });
      }
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      <View style={[
        styles.statusBarSpace,
        orientation === 'landscape' ? styles.statusBarSpaceLandscape : null
      ]} />
      <WebViewNavBar webViewRef={webViewRef} initialUrl={initialUrl} />
      <WebView 
        ref={webViewRef}
        style={styles.webview}
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
    backgroundColor: '#fff',
  },
  statusBarSpace: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff',
  },
  statusBarSpaceLandscape: {
    height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) / 2 : 0,
  },
  webview: {
    flex: 1,
  },
});
