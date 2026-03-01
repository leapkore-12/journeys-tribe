

## Restore Share Page to Match Figma Design

### Problem
The Share page was changed to an immersive full-screen edge-to-edge layout, but the Figma design shows a card-based layout with:
1. RoadTribe logo centered at the top
2. Trip image displayed as a contained card (not full-screen)
3. Pagination dots below the card
4. Instagram Story / Download Image buttons below dots
5. Bottom navigation bar (Feed, Trip, Profile) visible

### Changes

**1. `src/App.tsx`** — Move the `/share/:postId` route inside the `MainLayout` route group so the bottom navigation bar is visible.

**2. `src/pages/Share.tsx`** — Restructure the layout from immersive full-screen to card-based:
- Remove the full-screen black background with negative margins and safe-area hacks
- Add the RoadTribe logo (logo-white.svg) centered at the top
- Change the carousel from full-height edge-to-edge to a contained card with rounded corners and proper aspect ratio
- Keep the branded overlays (distance, time, convoy, watermark) on the card
- Move pagination dots below the card (not overlaid)
- Place action buttons (Instagram Story, Download Image) below the dots
- Remove the floating back button (bottom nav handles navigation)
- Keep the 3rd-party share sheet as-is

