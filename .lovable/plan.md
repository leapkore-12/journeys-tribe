

## Fix Active Trip Map Not Filling From Top

### Problem
`MobileContainer` adds `paddingTop: env(safe-area-inset-top)` to all pages. For the ActiveTrip map page, this creates a black gap at the top because the map should go edge-to-edge behind the status bar. The header overlay already handles its own safe area padding.

### Solution — `src/pages/ActiveTrip.tsx`

Change the root container from `min-h-screen` to `h-screen` with negative margin to pull the content up behind MobileContainer's padding:

Actually, the cleaner fix is in `MobileContainer.tsx` — but that affects all pages.

The best approach: Override the MobileContainer padding on ActiveTrip by using a negative top margin or absolute positioning to break out of the padding.

**Change line 477** in `ActiveTrip.tsx`:
```tsx
// From:
<div className="min-h-screen bg-background relative overflow-hidden">

// To:
<div 
  className="bg-background relative overflow-hidden"
  style={{ 
    height: '100vh',
    marginTop: `-env(safe-area-inset-top, ${safeAreaTop}px)`,
  }}
>
```

This pulls the map container up to cover the safe area gap that MobileContainer creates, while the header overlay's own `paddingTop` still keeps the buttons in the correct position.

One file, ~3 lines changed.

