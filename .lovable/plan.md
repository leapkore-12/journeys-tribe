

## Fix: Slow App Start / Login Page Flash for Logged-In Users

### Problem
When a logged-in user opens the app, they see:
1. Splash screen (logo + buttons) — no auth check
2. They tap Login (or it was bookmarked to `/login`)
3. Login page renders the full form while auth is still loading
4. After 1-2 seconds, auth finishes loading, detects the session, and redirects to `/feed`

This creates an unpleasant flash of the login form.

### Root Causes
1. **Splash page (`/`)** has zero auth awareness — it always shows Login/Sign Up buttons even for logged-in users
2. **Login page** shows the full form immediately, only redirecting via a `useEffect` after auth finishes loading — no loading state shown during the check

### Changes

**1. `src/pages/Splash.tsx`** — Add auth check
- Import `useAuth` and `useIsAdmin`
- While auth is loading, show the logo animation only (no buttons yet)
- Once auth resolves: if user is logged in, immediately redirect to `/feed` (or `/admin/dashboard` for admins) — skip the buttons entirely
- If not logged in, show the Login/Sign Up buttons as normal

**2. `src/pages/Login.tsx`** — Show spinner while auth loads
- While `authLoading || adminLoading` is true, render a centered loading spinner instead of the login form
- This prevents the form from flashing before the redirect kicks in

### Result
- Logged-in users: Splash → logo animation → instant redirect to `/feed` (no login page flash)
- Logged-out users: Splash → logo animation → buttons appear → tap Login → login form

