

## Fix Stops Not Showing in Trip Review + Logo-Title Spacing

### Problem 1: Stops missing from review page
TripPlanner maintains a **separate `localStops` array** (line 45) alongside the context `tripState.stops`. When the user adds a stop, `addStop()` is called on the context AND a new item is pushed to `localStops` — but each creates its own `Date.now()` ID. This means:
- The local and context stop IDs are **always different**
- When removing a stop, `removeStop(stop.id)` uses the local ID, which **doesn't match** the context ID — so context stops are never removed
- The route calculation useEffect depends on `localStops` (line 108), not context stops
- Any re-sync issues between the two states could cause stops to be lost in the context

**Fix:** Eliminate `localStops` entirely. Use `tripState.stops` directly everywhere in TripPlanner. This ensures a single source of truth — stops added/removed are always reflected in context and therefore in the review page.

### Problem 2: Logo-to-title spacing too tight
Both TripPlanner and TripReview have `pt-6` on the title wrapper. Increasing to `pt-8` adds breathing room between the header logo and "Trip Planner" heading.

### Changes

**`src/pages/TripPlanner.tsx`**
1. Remove `localStops` state variable (line 45)
2. Replace all `localStops` references with `tripState.stops`
3. In `handleAddStop`, remove the `setLocalStops(...)` line — context `addStop` is sufficient
4. In the remove-stop handler, remove the `setLocalStops(...)` line — context `removeStop` is sufficient
5. In the route calculation useEffect, use `tripState.stops` instead of `localStops`
6. Change title wrapper padding from `pt-6` to `pt-8`

**`src/pages/TripReview.tsx`**
1. Change title wrapper padding from `pt-6` to `pt-8`

