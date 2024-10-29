import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useOrientation } from '../../hooks/useOrientation';

interface WebViewNavBarProps {
  webViewRef: React.RefObject<WebView>;
  initialUrl: string;
}

export function WebViewNavBar({ webViewRef, initialUrl }: WebViewNavBarProps) {
  const orientation = useOrientation();

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
    webViewRef.current?.injectJavaScript(`window.location.href = '${initialUrl}';`);
  };

  return (
    <View style={[
      styles.container,
      orientation === 'landscape' ? styles.landscapeContainer : null
    ]}>
      <TouchableOpacity onPress={handleBack} style={styles.button}>
        <Ionicons name="arrow-back" size={22} color="rgba(0,0,0,0.5)" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleForward} style={styles.button}>
        <Ionicons name="arrow-forward" size={22} color="rgba(0,0,0,0.5)" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleRefresh} style={styles.button}>
        <Ionicons name="refresh" size={22} color="rgba(0,0,0,0.5)" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleHome} style={styles.button}>
        <Ionicons name="home" size={22} color="rgba(0,0,0,0.5)" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  landscapeContainer: {
    paddingVertical: 3, // Slightly smaller in landscape
  },
  button: {
    padding: 6,
    borderRadius: 20,
  },
});
