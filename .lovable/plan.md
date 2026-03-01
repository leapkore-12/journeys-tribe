

## Fix: Trip Planner Header Has Extra Top Spacing

### Problem
The Trip Planner screen uses `TripHeader`, which applies its own safe-area top padding via `paddingTop: max(env(safe-area-inset-top), safeAreaTop)`. But `MobileContainer` already adds top safe-area padding globally. This causes double padding on the Trip Planner, making the header sit lower than Feed and Profile.

Feed and Profile headers use a plain `<header>` with `h-14` and no extra top padding — they rely on `MobileContainer` for safe area handling.

### Fix

**`src/components/trip/TripHeader.tsx`** — Remove the inline `paddingTop` style that duplicates the safe area. Keep the header as a simple `h-14` flex container, matching Feed and Profile headers.

Remove:
```tsx
style={{ 
  paddingTop: `max(env(safe-area-inset-top, ${safeAreaTop}px), ${safeAreaTop}px)` 
}}
```

Also remove the `useDeviceSpacing` import since it's no longer needed.

