import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'bbzcloud-temp',
  webDir: 'dist',
  plugins: {
    // Note: Keyboard config only affects MainActivity, not InAppBrowser
    // InAppBrowser handles keyboard via JavaScript injection
  },
  // Server-Konfiguration für Development
  server: {
    // Uncomment für lokales Testing
    // androidScheme: 'https',
    // iosScheme: 'capacitor'
  }
};

export default config;
