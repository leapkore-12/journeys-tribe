

## Answers and Plan

### Offline Maps "Not available in this browser"
This message appears because the `OfflineMapDownload` component checks `isSupported` from `useOfflineMaps`, which requires **Service Workers** to be available (`'serviceWorker' in navigator`). In the Lovable preview iframe and many mobile webview contexts, service workers are not supported. This is a browser/environment limitation, not a beta restriction. It will work in production when accessed as a standalone PWA or in browsers that support service workers (Chrome, Firefox, Safari on iOS 11.3+). On native Capacitor builds, service worker support varies.

### Plan: Add Coordinates Input to LocationSearchInput

Allow users to type raw latitude,longitude (e.g. `12.9716, 77.5946`) in the destination box and have it recognized as a valid location.

**File: `src/components/trip/LocationSearchInput.tsx`**

1. Add a coordinate detection regex that matches patterns like `12.9716, 77.5946` or `12.9716,77.5946`
2. In the search effect (line 33-38), before calling Mapbox geocoding, check if the input matches lat,lng format
3. If it matches, create a synthetic `GeocodingResult` using reverse geocoding to get a place name, and display it as a dropdown result
4. This way users can paste or type coordinates directly and select the result

**File: `src/hooks/useMapboxGeocoding.ts`**

No changes needed — the existing `reverseGeocode` method already supports converting coordinates to place names.

**Implementation detail:**
- Regex: `/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/`
- Validate lat is -90 to 90, lng is -180 to 180
- Show a result like "12.9716, 77.5946" with the reverse-geocoded address below it
- On select, pass the coordinates through `onSelect` as usual

