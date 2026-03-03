

## Fix: Active Trip Bottom Bar Getting Cut Off

### Problem
The bottom info card (showing time, distance, and Pause button) is positioned too low on the screen, getting cut off or overlapping with the Mapbox attribution on native iOS devices. The current positioning uses `bottom: safeAreaBottom + 16` which doesn't provide enough clearance.

### Solution
Increase the bottom offset for the info card from `safeAreaBottom + 16` to `safeAreaBottom + 24` to give it more breathing room. Also adjust the Re-centre button cluster offset proportionally.

### Changes

**`src/pages/ActiveTrip.tsx`**:
- Line 658: Change Re-centre button bottom from `safeAreaBottom + 200` to `safeAreaBottom + 210`
- Line 679: Change bottom info card from `safeAreaBottom + 16` to `safeAreaBottom + 32`

This gives the bottom card more space above the screen edge and home indicator on iOS devices, preventing it from being clipped.

