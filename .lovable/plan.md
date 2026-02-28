

## Fix Active Trip Navigation UI

### Issues identified from screenshot and code:

1. **Header has no background** — logo, back arrow, share/call buttons float over the map with no backdrop, making them hard to see
2. **Green direction banner** clashes with the turquoise map — needs to be white with dark text to match brand
3. **Duplicate pause buttons** — there's a Pause in the bottom info card (line 666-701) AND a full-width "Pause trip" button below it (line 703-712), pushing content off-screen
4. **Bottom layout issue** — the full-width Pause button at `bottom-0` pushes the info card too high and makes the Pause itself hard to reach

### Changes — all in `src/pages/ActiveTrip.tsx`:

**1. Add semi-transparent background to header overlay (lines 488-523)**
- Add `bg-background/70 backdrop-blur-md` to the header container div so the logo and buttons are readable over the map

**2. Change direction banner from green to white (lines 575-593)**
- Change `bg-green-600` → `bg-white/90 backdrop-blur-md`
- Change text colors from `text-white` → `text-foreground` and `text-white/70` → `text-muted-foreground`
- Change icon background from `bg-white/20` → `bg-primary/10`
- Change icon colors to use `text-primary`

**3. Remove the duplicate full-width Pause button (lines 703-712)**
- Delete the entire `{/* Pause Trip Button */}` section at the bottom
- The Pause button in the bottom info card (line 693-698) already handles this

**4. Move bottom info card down (line 666)**
- Change `bottom-28` → `bottom-8` so it sits near the bottom of the screen with proper spacing, now that the duplicate button is removed

