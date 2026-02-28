

## Fix: Show Stops in Trip Review + Add Spacing

### Issue 1: Stops not shown in TripReview

The `TripReview.tsx` page reads `tripState.stops` but never renders them. It only shows start and destination cards, then an "Add stops" button. Stops added during planning are in `tripState.stops` but aren't displayed.

### Issue 2: Spacing between logo and "Trip Planner"

The header and title are too close together. Need more vertical padding.

---

### Changes

**File: `src/pages/TripReview.tsx`**

1. Between the Destination Card and "Add stops" button (after line 211), render `tripState.stops` as cards with a `MapPin` icon, showing each stop's address — same card style as start/destination
2. Increase spacing between the header (logo) and "Trip Planner" title by changing `pt-2` to `pt-6` on the title div (line 160)

**File: `src/pages/TripPlanner.tsx`**

3. Same spacing fix — change `pt-2` to `pt-6` on the title div (line 289) to keep consistency

