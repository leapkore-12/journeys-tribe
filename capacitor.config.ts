import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.roadtribe.mobile',
  appName: 'RoadTribe',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'Dark'
    }
  }
};

export default config;
