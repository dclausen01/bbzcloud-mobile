import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'bbzcloud-temp',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
