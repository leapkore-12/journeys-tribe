

## Plan: Fix Login Page Flash for Already-Authenticated Users

### Root Cause

The `AuthContext` sets `isLoading = false` in **both** the `onAuthStateChange` callback AND the `getSession()` promise. Whichever fires first wins. 

The problem: `onAuthStateChange` fires an `INITIAL_SESSION` event. If the token refresh fails (as shown in the console — "Failed to fetch" on refresh_token), it fires with `session = null`, which sets `user = null` and `isLoading = false`. The Splash page then sees "no user, not loading" → shows Login/Signup buttons (or the user navigates to login). A moment later, `getSession()` resolves with the cached session → user gets set → redirect to `/feed`. This causes the 1-2 second flash.

### Fix

**`src/context/AuthContext.tsx`** — Remove `setIsLoading(false)` from the `onAuthStateChange` callback. Only resolve loading state from `getSession()`, which returns the locally-cached session reliably even when the network is down. The `onAuthStateChange` listener still updates user/session for all subsequent events (login, logout, token refresh success).

```typescript
useEffect(() => {
  // Set up auth state listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Do NOT set isLoading here — let getSession control initial load
    }
  );

  // THEN check for existing session — this controls initial loading state
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setIsLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);
```

This is a 1-line removal in a single file. The `getSession()` call returns the cached session from localStorage immediately, so there's no delay — it just prevents the race condition where a failed token refresh briefly clears the user state before `getSession` resolves.

