

## Fix: Comments Section Overlapping with Comment Input Bar on Trip Detail

### Problem
The Trip Detail page has no bottom navigation bar, but the comment input uses `FixedBottomActions` with `aboveNav={true}` (default), which calculates its position assuming a nav bar exists. This causes the fixed comment input to overlap with the comments list content.

### Changes

**`src/pages/TripDetail.tsx`**:
1. Set `aboveNav={false}` on `FixedBottomActions` since Trip Detail has no bottom nav bar — the input should sit at the screen bottom with safe area padding only.
2. Increase the scrollable container's bottom padding from `pb-20` to `pb-28` so the last comment isn't hidden behind the fixed input bar.

