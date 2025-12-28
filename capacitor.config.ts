import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.roadtribe.mobile',
  appName: 'RoadTribe',
  webDir: 'dist',
  server: {
    // Hot reload during development - REMOVE for App Store release!
    url: 'https://ce09c587-7863-4548-9382-e8fdec3d2473.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'Dark'
    }
  }
};

export default config;
