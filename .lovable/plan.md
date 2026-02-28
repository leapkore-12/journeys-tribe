

## Issues to Fix

### 1. Vehicle image showing as first slide (should only show user-selected photos)
In `TripCard.tsx` line 184, the slides array includes the vehicle image from the garage (`trip.vehicle?.images?.[0]`). The user wants only the map route and user-uploaded trip photos — no automatic vehicle image injection.

**Fix in `TripCard.tsx` (line 182-186):** Remove the vehicle image slide from the slides array. Only include map and trip_photos.

**Fix in `TripDetail.tsx` (similar slides array ~line 242):** Same change — remove vehicle slide.

### 2. No map route snippet as first slide
The map_image_url may not be getting generated/stored properly during posting. Looking at `PostTrip.tsx` lines 139-152, the static map URL is generated from Mapbox and stored as `map_image_url`. If the URL is present, TripCard already shows it first. The issue might be that `map_image_url` is null for some trips, so only the vehicle image shows.

**No code change needed for ordering** — once vehicle image is removed, map will naturally be first if present. If map_image_url is missing for existing trips, that's a data issue from the posting flow.

### 3. Remove green line and green background dividers
- `TripCard.tsx` line 486: `bg-primary/30` thin green line → change to `bg-border`
- `TripCard.tsx` line 513: `bg-primary/20` thick green divider → change to `bg-border`
- `TripDetail.tsx` line 383: `bg-primary/30` thin green line → change to `bg-border`  
- `TripDetail.tsx` line 409: `bg-primary/20` thick green divider → change to `bg-border`

### 4. Like button touch target too small
The like button in the action row already has `min-h-11` but lacks `min-w-11`. The issue is the `flex-1` buttons share space but the Flag icon itself is small. Add `min-w-11` to all three action buttons in both `TripCard.tsx` and `TripDetail.tsx` for consistent 44px touch targets.

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/TripCard.tsx` | Remove vehicle slide from carousel; change green dividers to `bg-border`; ensure action button touch targets |
| `src/pages/TripDetail.tsx` | Remove vehicle slide from carousel; change green dividers to `bg-border`; ensure action button touch targets |

