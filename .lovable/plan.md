

## Fix: Make Both Action Buttons Visible on Share Page

### Problem
The image card with `aspect-[9/16]` takes up too much vertical space, pushing the "Instagram Story" button off-screen. Only "Download Image" is visible above the bottom nav bar.

### Solution
Reduce the card's aspect ratio slightly and ensure the action buttons area doesn't get clipped. Two changes:

**`src/pages/Share.tsx`**:
1. Change the card aspect ratio from `aspect-[9/16]` to `aspect-[3/4]` — this gives more room for both buttons while still showing the image prominently.
2. Alternatively, make the entire content area scrollable (`overflow-y-auto`) so users can scroll to see both buttons if the screen is small.
3. Reduce vertical padding/spacing between dots and buttons (`pt-3 space-y-3` → `pt-2 space-y-2`) to reclaim space.

The recommended approach is to combine a slightly shorter aspect ratio with tighter spacing, keeping the layout non-scrollable and clean — matching the reference design where the image fills most of the screen but both buttons remain visible.

