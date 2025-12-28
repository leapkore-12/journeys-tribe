import { Capacitor } from '@capacitor/core';

/**
 * Initialize Capacitor plugins for native platforms
 * This handles iOS-specific configurations like status bar
 */
export async function initCapacitor() {
  if (Capacitor.isNativePlatform()) {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      
      // Enable overlay mode - status bar overlays on top of web content
      // The CSS safe-area-inset-top will push content below the status bar
      await StatusBar.setOverlaysWebView({ overlay: true });
      
      // Use Dark style (light/white text) for dark theme app
      await StatusBar.setStyle({ style: Style.Dark });
      
      console.log('Capacitor StatusBar initialized');
    } catch (error) {
      // StatusBar plugin not available (web or plugin not installed)
      console.log('StatusBar plugin not available:', error);
    }
  }
}
