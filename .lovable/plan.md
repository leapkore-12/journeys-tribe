

## Fix Flag/Like Button Tap Target Size

### Problem
The flag (like) button in the action row at the bottom of each trip card is hard to tap on touchscreens. While it has `min-h-11 min-w-11`, the icon inside is only `h-6 w-6` (24px), and the button uses `flex-1` which makes width flexible but the actual tappable area around the icon may still feel small due to the icon being the only visual anchor.

### Solution — `src/components/TripCard.tsx`

1. **Increase action row height** — Change `py-2` to `py-3` on the action row container (line 488) to give more vertical breathing room.

2. **Add padding to each action button** — Add explicit `py-3 px-6` padding to each of the three action buttons (like, comment, share) so the entire touchable area is generous and forgiving, not just the icon center.

3. **Bump icon size slightly** — Increase flag icon from `h-6 w-6` to `h-7 w-7` (28px) for a larger visual tap target.

These changes ensure the tap area is well above 44×44px in practice and the icon itself is larger, making it much easier to hit on a touchscreen.

