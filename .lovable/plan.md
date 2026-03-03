

## Fix: Direction Banner Text Invisible on White Background

The direction banner on the Active Trip map uses a white/translucent background (`bg-white/90`) but the text color `text-foreground` resolves to white in dark mode — white text on white background = invisible.

### Change

**`src/pages/ActiveTrip.tsx`** (line 591-604):
- Change the main instruction text from `text-foreground` to `text-gray-900` (dark text on white bg)
- Change the secondary instruction text from `text-muted-foreground` to `text-gray-500`
- These are explicit colors that work regardless of the dark/light theme, since the banner itself is always white

This matches how the banner appears in your screenshot reference — dark text on a light card.

