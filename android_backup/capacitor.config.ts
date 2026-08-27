import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tarapti.app',
  appName: 'TARAPTI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
