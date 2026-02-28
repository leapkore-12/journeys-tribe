

## Make Share Screen Immersive — Image-Only View

### Problem
The Share page currently shows a full page layout with header bar (back button, logo), the image carousel at a constrained size, and action buttons below. The user wants an immersive, edge-to-edge view where only the trip image with its overlays (distance, time on road, RoadTribe watermark) is prominent — matching the second screenshot.

### Changes — `src/pages/Share.tsx`

1. **Remove the top header bar** (back button + logo bar) — replace with a floating back button overlaid on the image
2. **Make the image full-screen / edge-to-edge** — remove `px-4 py-6` padding, remove `max-h-[500px]` constraint, make the image fill the viewport
3. **Float action buttons at the bottom** — overlay the Instagram Story / Download buttons at the bottom of the screen over the image, or place them in a minimal bottom area
4. **Remove the separate stats display outside the image** — the overlays on the image itself already show distance and time on road
5. **Keep pagination dots** — but overlay them on the image or just below

### Layout (new structure)
```text
┌──────────────────────┐
│ ← (floating)         │
│                      │
│   Distance   Time    │  ← overlay on image
│   339 km    6h 24m   │
│                      │
│                      │
│     [TRIP IMAGE]     │  ← full screen
│                      │
│                      │
│         RT RoadTribe │  ← overlay on image
│  ● ○                 │  ← dots
├──────────────────────┤
│  [Instagram Story]   │  ← minimal bottom area
│  [Download Image]    │
└──────────────────────┘
```

### Implementation
- Container: `flex flex-col h-full bg-black` (black background for immersive feel)
- Image area: `flex-1 relative` with no padding, image fills available space
- Back button: `absolute top-4 left-4 z-50` floating on image
- Action buttons: fixed bottom section with minimal padding, semi-transparent background
- Dots: overlaid at bottom of image area
- Remove the header `<header>` element entirely

One file changed (~30 lines modified).

