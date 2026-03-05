

## Plan: Fix Login Page Flash for Already-Logged-In Users

### Problem

When a logged-in user opens the app, the flow is:
1. Splash screen shows (logo animates in) — `isLoading` is `true`
2. `getSession()` resolves → `isLoading` becomes `false`, `user` is set
3. Splash redirects to `/feed`... but there's a race: the `onAuthStateChange` fires and sets `user` *before* `getSession` sets `isLoading = false`. Meanwhile if the user navigates directly to `/login`, the Login page briefly renders the form while `useIsAdmin` query is still loading.

The core issue: `onAuthStateChange` sets `user` but does NOT set `isLoading = false`. So there's a window where `user` exists but `isLoading` is still `true`. Then `getSession` resolves, sets `isLoading = false`, the Login page renders the form, and *then* the redirect `useEffect` fires — causing a visible flash of the login form.

### Fix

**`src/pages/Login.tsx`** (~line 82-88):
- The Login page already shows a spinner when `authLoading || adminLoading`. The issue is that `adminLoading` resolves to `false` (since `useIsAdmin` is `enabled: !!user?.id` and returns immediately when user exists) slightly after the form renders for one frame.
- **Real fix**: Move the redirect check *before* the render, not just in a `useEffect`. Add an early return: if `user` is set (even while admin is loading), show the spinner — never show the login form to an already-authenticated user.

**Change in `src/pages/Login.tsx`** (around line 82):
```typescript
// Show spinner while checking auth state OR if user is already logged in (redirect pending)
if (authLoading || adminLoading || user) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
```

Same fix needed in **`src/pages/Signup.tsx`** — check if user exists and show spinner instead of the signup form.

This ensures that if a user is already authenticated, they never see the login/signup form — just a spinner until the redirect fires.

