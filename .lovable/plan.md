

## Add Delete Trip Option to Feed

### Problem
The "Delete trip" menu option is intentionally hidden when `context === 'feed'` (line 244 of TripCard.tsx). It only appears on profile/detail pages. The `handleDelete` function also just logs — it doesn't actually delete.

### Changes — `src/components/TripCard.tsx`

1. **Import** `useDeleteTrip` from `@/hooks/useTrips`, `AlertDialog` components from `@/components/ui/alert-dialog`, and `toast` from `sonner`.

2. **Add state and hook**: `const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)` and `const deleteTrip = useDeleteTrip()`.

3. **Update `handleDelete`** (line 193-196): Instead of console.log, open the confirmation dialog: `setDeleteDialogOpen(true); setMenuOpen(false);`.

4. **Add `confirmDelete` function**: Calls `deleteTrip.mutateAsync(trip.id)`, shows success toast, navigates back if on detail page.

5. **Remove the `context !== 'feed'` guard** (line 244): Show "Delete trip" for own posts in all contexts.

6. **Add AlertDialog JSX** at the end of the component (before closing `</motion.article>`): Confirmation dialog matching the pattern used in TripDetail.tsx.

One file changed, ~30 lines added.

