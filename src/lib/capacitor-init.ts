import { Capacitor } from '@capacitor/core';

/**
 * Initialize Capacitor plugins for native platforms
 * This handles iOS-specific configurations like status bar
 */
export async function initCapacitor() {
  if (Capacitor.isNativePlatform()) {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      
      // Disable overlay so status bar has its own space
      // This fixes touch issues on iOS where header elements
      // were being overlapped by the status bar
      await StatusBar.setOverlaysWebView({ overlay: false });
      
      // Use dark style for dark theme app
      await StatusBar.setStyle({ style: Style.Dark });
      
      console.log('Capacitor StatusBar initialized');
    } catch (error) {
      // StatusBar plugin not available (web or plugin not installed)
      console.log('StatusBar plugin not available:', error);
    }
  }
}
