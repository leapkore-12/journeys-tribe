

## Fix Fullscreen Image Viewer Close Button in Garage

### Problem
The fullscreen image viewer Dialog uses the default DialogContent close button (X icon at 16x16px). On mobile, this is nearly invisible on the black background and too small to tap reliably. The overlay click may also not register properly due to the full-screen content div intercepting touches.

### Solution — `src/pages/Garage.tsx`

1. **Add a visible, large close button** — Replace reliance on the tiny default X with an explicit large close button (e.g., 44x44px tap target with a visible X icon) positioned at top-right with safe area consideration.

2. **Make the background tappable to close** — Add an `onClick` handler on the background area so tapping outside the image also closes the viewer.

3. **Hide the default DialogContent close button** — Use `[&>button]:hidden` to remove the tiny default one.

### Changes — `src/pages/Garage.tsx` (lines 186-199)

Replace the Dialog block with:
- A custom close button using the `X` icon (already imported) with `min-h-11 min-w-11` tap target
- The image container gets a click handler that closes on background tap (not on the image itself)
- Default close button hidden via `[&>button]:hidden`

### Files changed
1. `src/pages/Garage.tsx` — Replace fullscreen image viewer close mechanism

