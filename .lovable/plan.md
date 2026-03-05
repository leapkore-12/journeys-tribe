

## Plan: Lift Bottom Info Card Higher on Active Trip

The bottom info card (showing trip stats and Pause button) is positioned at `safeAreaBottom + 32` pixels, which sits too close to the screen edge. I'll increase this to `safeAreaBottom + 48` to give more breathing room.

### Change

**`src/pages/ActiveTrip.tsx`** (line 674):
- Change `bottom: safeAreaBottom + 32` to `bottom: safeAreaBottom + 48`
- Also adjust the re-centre button offset from `safeAreaBottom + 210` to `safeAreaBottom + 226` to maintain consistent spacing above the card.

