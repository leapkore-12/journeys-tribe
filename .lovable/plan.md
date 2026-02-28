

## Fix PostTrip Scrolling & Vehicle Emoji

### Problem 1: Page not scrollable
The outer container on line 274 uses `flex flex-col bg-background` but is missing `h-full`. The inner content div on line 277 has `overflow-y-auto` but without a height constraint on the parent, it won't scroll.

### Problem 2: Vehicle emoji too large/colorful
The `🚗` emoji at `text-2xl` size (line 364) is visually dominant. Replace all `🚗` usages across the app with a simpler car icon from Lucide (`Car`) styled in the primary/turquoise color.

### Changes

**`src/pages/PostTrip.tsx`**
- Line 274: Change outer div to `flex flex-col h-full bg-background` to enable scrolling
- Line 364: Replace `<span className="text-2xl">🚗</span>` with a Lucide `Car` icon sized appropriately and colored `text-primary`
- Import `Car` from `lucide-react`

**`src/components/TripCard.tsx`** (line 247)
- Replace `🚗` with `<Car className="h-3.5 w-3.5 text-primary inline" />` 

**`src/pages/TripDetail.tsx`** (line 257)
- Same replacement as TripCard

**`src/pages/TripReview.tsx`** (line 199)
- Replace `🚗 {tripState.vehicle.name}` with Car icon + text

**`src/pages/TripPlanner.tsx`** (lines 348, 382)
- Replace both `🚗` instances with Car icon

**`src/components/ProfileTripCard.tsx`** (line 118)
- Replace `🚗` with Car icon

6 files, ~12 lines changed. The `LiveTrackingMap.tsx` uses it in raw HTML strings for map popups — will leave that as-is since it's a different rendering context.

