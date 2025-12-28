import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// iPhone screen dimensions for model detection
const iPhoneModels = {
  // Older models (no notch)
  'iPhone SE 1st Gen': { width: 320, height: 568, hasNotch: false, hasDynamicIsland: false },
  'iPhone 6/7/8': { width: 375, height: 667, hasNotch: false, hasDynamicIsland: false },
  'iPhone 6/7/8 Plus': { width: 414, height: 736, hasNotch: false, hasDynamicIsland: false },
  'iPhone SE 2nd/3rd Gen': { width: 375, height: 667, hasNotch: false, hasDynamicIsland: false },
  
  // Notch models
  'iPhone X/XS/11 Pro': { width: 375, height: 812, hasNotch: true, hasDynamicIsland: false },
  'iPhone XR/11': { width: 414, height: 896, hasNotch: true, hasDynamicIsland: false },
  'iPhone XS Max/11 Pro Max': { width: 414, height: 896, hasNotch: true, hasDynamicIsland: false },
  'iPhone 12 Mini/13 Mini': { width: 375, height: 812, hasNotch: true, hasDynamicIsland: false },
  'iPhone 12/12 Pro/13/13 Pro/14': { width: 390, height: 844, hasNotch: true, hasDynamicIsland: false },
  'iPhone 12 Pro Max/13 Pro Max/14 Plus': { width: 428, height: 926, hasNotch: true, hasDynamicIsland: false },
  
  // Dynamic Island models
  'iPhone 14 Pro': { width: 393, height: 852, hasNotch: false, hasDynamicIsland: true },
  'iPhone 14 Pro Max': { width: 430, height: 932, hasNotch: false, hasDynamicIsland: true },
  'iPhone 15/15 Pro': { width: 393, height: 852, hasNotch: false, hasDynamicIsland: true },
  'iPhone 15 Plus/15 Pro Max': { width: 430, height: 932, hasNotch: false, hasDynamicIsland: true },
  'iPhone 16/16 Pro': { width: 393, height: 852, hasNotch: false, hasDynamicIsland: true },
  'iPhone 16 Plus/16 Pro Max': { width: 440, height: 956, hasNotch: false, hasDynamicIsland: true },
};

type DeviceCategory = 'small' | 'medium' | 'large' | 'xlarge';
type DeviceType = 'iphone' | 'ipad' | 'android' | 'web';

interface DeviceSpacing {
  statusBarHeight: number;
  headerHeight: number;
  bottomNavHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  contentPadding: number;
}

interface DeviceInfo {
  isNative: boolean;
  deviceType: DeviceType;
  isIPhone: boolean;
  isIPad: boolean;
  isAndroid: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  hasNotch: boolean;
  hasDynamicIsland: boolean;
  hasHomeIndicator: boolean;
  sizeCategory: DeviceCategory;
  spacing: DeviceSpacing;
  modelName: string | null;
}

function getInitialDeviceInfo(): DeviceInfo {
  return {
    isNative: false,
    deviceType: 'web',
    isIPhone: false,
    isIPad: false,
    isAndroid: false,
    screenWidth: 390,
    screenHeight: 844,
    pixelRatio: 1,
    hasNotch: false,
    hasDynamicIsland: false,
    hasHomeIndicator: false,
    sizeCategory: 'medium',
    spacing: {
      statusBarHeight: 0,
      headerHeight: 56,
      bottomNavHeight: 64,
      safeAreaTop: 0,
      safeAreaBottom: 0,
      contentPadding: 16,
    },
    modelName: null,
  };
}

function detectiPhoneModel(width: number, height: number): { name: string; hasNotch: boolean; hasDynamicIsland: boolean } | null {
  const portraitWidth = Math.min(width, height);
  const portraitHeight = Math.max(width, height);
  
  for (const [name, specs] of Object.entries(iPhoneModels)) {
    if (specs.width === portraitWidth && specs.height === portraitHeight) {
      return { name, hasNotch: specs.hasNotch, hasDynamicIsland: specs.hasDynamicIsland };
    }
  }
  
  // Fallback detection by height ranges
  if (portraitHeight >= 932) {
    return { name: 'iPhone Pro Max (estimated)', hasNotch: false, hasDynamicIsland: true };
  } else if (portraitHeight >= 844) {
    return { name: 'iPhone (modern)', hasNotch: true, hasDynamicIsland: false };
  } else if (portraitHeight >= 812) {
    return { name: 'iPhone X-era', hasNotch: true, hasDynamicIsland: false };
  } else {
    return { name: 'iPhone (classic)', hasNotch: false, hasDynamicIsland: false };
  }
}

function getSizeCategory(width: number, height: number): DeviceCategory {
  const portraitWidth = Math.min(width, height);
  
  if (portraitWidth <= 320) return 'small';
  if (portraitWidth <= 375) return 'medium';
  if (portraitWidth <= 414) return 'large';
  return 'xlarge';
}

function calculateSpacing(
  deviceType: DeviceType,
  sizeCategory: DeviceCategory,
  hasNotch: boolean,
  hasDynamicIsland: boolean,
  hasHomeIndicator: boolean
): DeviceSpacing {
  let statusBarHeight = 20;
  let headerHeight = 56;
  let bottomNavHeight = 64;
  let safeAreaTop = 0;
  let safeAreaBottom = 0;
  let contentPadding = 16;
  
  if (deviceType === 'iphone') {
    if (hasDynamicIsland) {
      statusBarHeight = 59;
      safeAreaTop = 59;
    } else if (hasNotch) {
      statusBarHeight = 47;
      safeAreaTop = 47;
    } else {
      statusBarHeight = 20;
      safeAreaTop = 20;
    }
    
    if (hasHomeIndicator) {
      safeAreaBottom = 34;
      bottomNavHeight = 64 + 34;
    }
  }
  
  if (sizeCategory === 'small') {
    contentPadding = 12;
    headerHeight = 48;
  } else if (sizeCategory === 'xlarge') {
    contentPadding = 20;
    headerHeight = 60;
  }
  
  return {
    statusBarHeight,
    headerHeight,
    bottomNavHeight,
    safeAreaTop,
    safeAreaBottom,
    contentPadding,
  };
}

function getDeviceInfo(): DeviceInfo {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const pixelRatio = window.devicePixelRatio || 1;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isIPhone = /iphone/.test(userAgent);
  const isIPad = /ipad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(userAgent);
  
  let deviceType: DeviceType = 'web';
  if (platform === 'ios') deviceType = isIPad ? 'ipad' : 'iphone';
  else if (platform === 'android') deviceType = 'android';
  
  const modelInfo = detectiPhoneModel(screenWidth, screenHeight);
  const hasNotch = modelInfo?.hasNotch || false;
  const hasDynamicIsland = modelInfo?.hasDynamicIsland || false;
  const hasHomeIndicator = hasNotch || hasDynamicIsland;
  
  const sizeCategory = getSizeCategory(screenWidth, screenHeight);
  const spacing = calculateSpacing(deviceType, sizeCategory, hasNotch, hasDynamicIsland, hasHomeIndicator);
  
  return {
    isNative,
    deviceType,
    isIPhone,
    isIPad,
    isAndroid,
    screenWidth,
    screenHeight,
    pixelRatio,
    hasNotch,
    hasDynamicIsland,
    hasHomeIndicator,
    sizeCategory,
    spacing,
    modelName: modelInfo?.name || null,
  };
}

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getInitialDeviceInfo());

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(getDeviceInfo());
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

export function useDeviceSpacing() {
  const { spacing, sizeCategory, hasNotch, hasDynamicIsland } = useDeviceInfo();
  return { ...spacing, sizeCategory, hasNotch, hasDynamicIsland };
}

export type { DeviceInfo, DeviceSpacing, DeviceCategory, DeviceType };
