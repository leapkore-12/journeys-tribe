

## Plan: Fix Trip Review Scroll & Text Visibility Issues

### Issues
1. **Scroll bounce/clipping**: The scrollable area has `pb-48` but the `FixedBottomActions` overlay is taller, so content behind it gets cut off and the scroll "bounces back" when trying to reach the bottom.
2. **"Download Maps for Offline" text invisible**: The title uses the default `font-medium` class without an explicit `text-foreground`, making it dark-on-dark in dark mode.

### Changes

**`src/pages/TripReview.tsx`** (line 215):
- Increase bottom padding from `pb-48` to `pb-64` so the scrollable content extends well past the fixed bottom buttons, preventing the auto-scroll-back issue.

**`src/components/trip/OfflineMapDownload.tsx`** (line 198):
- Add `text-foreground` to the "Download Maps for Offline" title (`<p className="font-medium">`) so it's visible in dark mode.
- Also add `text-foreground` to the "Downloading maps..." text on line 166 for consistency.

