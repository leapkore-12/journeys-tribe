

## Fix PostTrip Bottom Buttons Positioning

### Problem
The "Delete trip" and "Post trip" buttons use `FixedBottomActions` with `aboveNav={true}` (default), which adds `bottomNavHeight` offset — but PostTrip has no bottom nav, so the buttons float too high with a visible gap from the bottom. The visibility dropdown also sits below the buttons in the scroll area, making it look disconnected.

### Changes — `src/pages/PostTrip.tsx`

1. **Move visibility dropdown below the buttons** — Move it into the `FixedBottomActions` area so it sits at the very bottom with the action buttons above it, keeping everything anchored together.

2. **Set `aboveNav={false}`** on `FixedBottomActions` — This positions the buttons at the screen bottom with only safe-area padding, not the bottom-nav offset.

3. **Adjust scroll area padding** — Update `pb-24` to account for the new bottom layout (buttons + visibility together).

### Result
Buttons and visibility will be flush at the bottom of the screen with only safe-area clearance, matching proper iPhone layout.

