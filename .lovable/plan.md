

## Fix: Garage Fullscreen Image Viewer Getting Stuck

### Problem
Clicking a vehicle photo opens a Radix `Dialog`-based fullscreen viewer that freezes the app. The Radix Dialog traps focus, applies scroll locks, and uses transforms for centering -- all of which conflict with a simple fullscreen image overlay. The close button becomes unresponsive, leaving the user stuck.

### Solution
Replace the Radix `Dialog` with a simple fixed-position overlay using `AnimatePresence` + `motion.div`. This is lightweight, doesn't trap focus or lock scroll, and dismisses reliably via the X button or tapping the background.

### Changes

**`src/pages/Garage.tsx`**:
- Remove the `Dialog` and `DialogContent` imports
- Replace the Dialog-based viewer (lines 196-219) with a simple `AnimatePresence` overlay:
  - Fixed fullscreen div with `z-50 bg-black/95`
  - Fade in/out animation via framer-motion
  - X close button (top-right, 44x44 tap target, `bg-white/20`)
  - Click background to dismiss
  - Image centered with `object-contain`
- No changes to the rest of the page

