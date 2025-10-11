import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'bbzcloud-temp',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'body', // WICHTIG: 'body' statt 'native' für bessere WebView-Unterstützung
      style: 'dark',
      resizeOnFullScreen: true,
      // Android-spezifische Einstellungen
      android: {
        resizeMode: 'adjustResize' // Explizit adjustResize setzen
      }
    },
    // Konfiguration für @capgo/inappbrowser falls verfügbar
    InAppBrowser: {
      androidToolbarColor: '#1976d2',
      showToolbar: true,
      closeButtonText: 'Schließen'
    }
  },
  // Server-Konfiguration für Development
  server: {
    // Uncomment für lokales Testing
    // androidScheme: 'https',
    // iosScheme: 'capacitor'
  }
};

export default config;