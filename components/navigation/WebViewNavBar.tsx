import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useOrientation } from '../../hooks/useOrientation';

interface WebViewNavBarProps {
  webViewRef: React.RefObject<WebView>;
  initialUrl: string;
}

export function WebViewNavBar({ webViewRef, initialUrl }: WebViewNavBarProps) {
  const orientation = useOrientation();
  const colorScheme = useColorScheme();
  
  const isDarkMode = colorScheme === 'dark';
  
  // Theme-specific colors
  const colors = {
    background: isDarkMode ? 'rgba(28,28,30,0.9)' : 'rgba(255,255,255,0.9)',
    iconColor: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };

  const handleBack = () => {
    webViewRef.current?.goBack();
  };

  const handleForward = () => {
    webViewRef.current?.goForward();
  };

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  const handleHome = () => {
    if (webViewRef.current) {
      // Clear history and load initial URL
      webViewRef.current.injectJavaScript(`
        window.history.pushState({}, '', '${initialUrl}');
        window.location.replace('${initialUrl}');
        true;
      `);
    }
  };

  return (
    <View style={[
      styles.container,
      orientation === 'landscape' ? styles.landscapeContainer : null,
      { 
        backgroundColor: colors.background,
        borderBottomColor: colors.borderColor 
      }
    ]}>
      <TouchableOpacity onPress={handleBack} style={styles.button}>
        <Ionicons name="arrow-back" size={22} color={colors.iconColor} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleForward} style={styles.button}>
        <Ionicons name="arrow-forward" size={22} color={colors.iconColor} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleRefresh} style={styles.button}>
        <Ionicons name="refresh" size={22} color={colors.iconColor} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleHome} style={styles.button}>
        <Ionicons name="home" size={22} color={colors.iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 1000,
  },
  landscapeContainer: {
    paddingVertical: 3,
  },
  button: {
    padding: 6,
    borderRadius: 20,
  },
});
