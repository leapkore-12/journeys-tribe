

## Add Sign Up Screen for Free Plan Users

### Overview
Add a signup page that mirrors the login page design. Free users can self-register in the app. Premium upgrades continue to happen via the RoadTribe website.

### Changes

**1. `src/context/AuthContext.tsx`** — Add `signUp` method
- Add a `signUp(email, password, username)` function that calls `supabase.auth.signUp` with user metadata (username/display_name)
- The existing `handle_new_user` trigger will auto-create the profile with `plan_type = 'free'`

**2. `src/pages/Signup.tsx`** — New page (mirrors Login design)
- Same layout as Login: logo, email, password, confirm password fields, show/hide toggle
- Username/display name field
- "Sign Up" button
- Link at bottom: "Already have an account? Login"
- On success, show toast about email confirmation (or redirect to feed if auto-confirm is enabled)

**3. `src/pages/Login.tsx`** — Add link to signup
- Replace "Accounts are created on the RoadTribe website" with a link: "Don't have an account? Sign up"
- Link navigates to `/signup`

**4. `src/App.tsx`** — Add `/signup` route
- Add public route for the Signup page alongside `/login`

### Files changed
1. `src/context/AuthContext.tsx` — Add `signUp` method
2. `src/pages/Signup.tsx` — New signup page
3. `src/pages/Login.tsx` — Add signup link
4. `src/App.tsx` — Add `/signup` route

