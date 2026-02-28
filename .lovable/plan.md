

## Fix Edge-to-Edge Display for ActiveTrip and Share Screens

### Problem
`MobileContainer` adds `paddingTop: env(safe-area-inset-top)` on native, creating a visible gap at the top for immersive/full-screen pages (ActiveTrip map, Share screen). The current negative margin fix on ActiveTrip may not fully work because the container also loses height due to the padding.

### Solution
For both immersive screens, use a combination of negative margin AND added padding compensation to truly fill edge-to-edge:

**`src/pages/ActiveTrip.tsx`** — Refine the fix:
```tsx
<div 
  className="bg-background relative overflow-hidden"
  style={{ 
    height: `calc(100vh + env(safe-area-inset-top, ${safeAreaTop}px))`,
    marginTop: `calc(-1 * env(safe-area-inset-top, ${safeAreaTop}px))`,
  }}
>
```
Adding `env(safe-area-inset-top)` to the height ensures the container actually fills the reclaimed space.

**`src/pages/Share.tsx`** — Apply the same pattern:
- Import `useDeviceSpacing` 
- Change root `<div className="flex flex-col h-full bg-black">` to use the same negative-margin + expanded-height style
- Adjust the floating back button top position to account for safe area: `top: max(env(safe-area-inset-top), 16px) + 8px`

### Files changed
1. `src/pages/ActiveTrip.tsx` — fix height calculation (1 line)
2. `src/pages/Share.tsx` — add negative margin + height fix, adjust back button positioning (~5 lines)

