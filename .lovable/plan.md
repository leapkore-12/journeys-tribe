

## Fix: Bottom Bar Cut Off on Active Trip Page

### Problem
The bottom info card (showing elapsed time, distance, Pause button) uses a fixed `bottom-8` (32px) positioning, which doesn't account for the iPhone home indicator safe area. This causes the bar to be partially obscured or clipped at the bottom of the screen.

### Changes

**`src/pages/ActiveTrip.tsx`** (line 679):
- Change the bottom info card's positioning from `bottom-8` to use a dynamic `bottom` style that includes the safe area bottom inset.
- Use `calc(env(safe-area-inset-bottom, 8px) + 8px)` or the `safeAreaBottom` value from `useDeviceSpacing` to ensure the card sits above the home indicator.
- The `useDeviceSpacing` hook is already imported — just need to destructure `safeAreaBottom` and apply it to the bottom card's style.

Specifically:
1. Destructure `safeAreaBottom` from `useDeviceSpacing()` (already imported at line 31, used at line 53).
2. On the bottom card container (line 679), replace the Tailwind `bottom-8` class with an inline `style={{ bottom: safeAreaBottom + 8 }}` to dynamically position it above the safe area.
3. Also update the "Re-centre" / convoy status container (line 658) from `bottom-56` to a dynamic value that sits above the bottom card, e.g. `style={{ bottom: safeAreaBottom + 100 }}`.

