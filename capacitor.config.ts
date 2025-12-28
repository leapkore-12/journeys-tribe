import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ce09c587786345489382e8fdec3d2473',
  appName: 'jlllllllj',
  webDir: 'dist',
  server: {
    // Hot reload from Lovable sandbox during development
    // REMOVE THIS BLOCK when building for App Store release!
    url: 'https://ce09c587-7863-4548-9382-e8fdec3d2473.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'Dark'
    }
  }
};

export default config;
