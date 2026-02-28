

## Fix "Leave Convoy" → "Leave Trip" for Solo Trips

### Problem
The dismiss confirmation dialog always says "Leave Convoy?" regardless of whether the user is on a solo trip or a group convoy trip.

### Changes — `src/components/trip/ActiveTripBar.tsx`

1. **Check if solo trip**: Compare `activeConvoy.trip.user_id === user.id` and add a query to count active convoy members for the trip. If only 1 member (the user), it's a solo trip.

2. **Simpler approach**: Since the `useActiveConvoy` hook already tells us `is_leader` and `trip.user_id`, we can fetch the member count inline. But the simplest: if the user owns the trip (`trip.user_id === user.id`), check member count. Or even simpler — just count members in the dismiss handler when we already hit the DB.

3. **Determine `isConvoy`**: In `handleDismiss`, after fetching the trip status, also fetch `convoy_members` count for the trip. If count > 1, it's a convoy. Store in state.

4. **Update dialog text dynamically**:
   - Solo: Title = "Leave Trip?", Description = "...leave the trip?", Button = "Leave Trip", toast = "Left trip"
   - Convoy: Title = "Leave Convoy?", Description = "...leave the convoy?", Button = "Leave Convoy", toast = "Left convoy"

### Implementation
- Add `const [isConvoy, setIsConvoy] = useState(false)` state
- In `handleDismiss`, after confirming trip is active, query `convoy_members` count where `trip_id` matches and `status = 'active'`. Set `isConvoy = count > 1`
- Replace hardcoded "Convoy" strings in dialog with conditional: `isConvoy ? 'Convoy' : 'Trip'`

One file changed, ~10 lines added.

