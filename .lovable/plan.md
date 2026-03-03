

## Plan: Add Robust Error Handling to handleStartTrip

### Problem
When the auth session expires or network fails during trip start, the `handleStartTrip` function in `TripReview.tsx` hangs — the loading spinner shows indefinitely because Supabase calls fail silently (no response), and the `finally` block may not always fire cleanly.

### Changes

**`src/pages/TripReview.tsx`**:

1. **Add a timeout wrapper** — wrap the entire `handleStartTrip` logic in a `Promise.race` with a 15-second timeout so the UI never hangs indefinitely.

2. **Check auth session before starting** — call `supabase.auth.getSession()` first. If no valid session, show a toast telling the user to log in again, and navigate to `/login`.

3. **Improve the catch block** — detect specific error types:
   - `TypeError: Failed to fetch` → show "Network error. Check your connection and try again."
   - Auth errors → show "Session expired. Please log in again." and navigate to `/login`.
   - Other errors → show the existing generic message.

4. **Ensure `setIsStarting(false)` always runs** — the `finally` block already does this, but the timeout case also needs to reset it.

### Implementation Detail

```typescript
// At the start of handleStartTrip:
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
  navigate('/login');
  return;
}

// Wrap main logic with timeout:
const timeout = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('TIMEOUT')), 15000)
);
await Promise.race([mainLogic(), timeout]);

// In catch: check error.message for 'Failed to fetch', 'TIMEOUT', etc.
```

This is a single-file change to `src/pages/TripReview.tsx`, focused on the `handleStartTrip` function.

