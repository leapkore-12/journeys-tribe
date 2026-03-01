

## Fix "Download my data" — Two Issues

### Problem 1: Edge Function Fails with "Invalid user token"
The edge function logs show `Error: Invalid user token`. The `export-user-data` function uses `supabase.auth.getUser()` to validate the token, but per the project's signing-keys setup, it should use `getClaims()` instead. Additionally, the CORS headers are missing newer required headers (`x-supabase-client-platform`, etc.).

### Problem 2: iOS File Access
On iOS, even when the export succeeds, the Web Share API approach should work — but the fallback (`window.open`) opens a blank tab with raw JSON that's hard to save. No change needed here once the function works, since `navigator.share` with a File object triggers the iOS share sheet (save to Files, AirDrop, etc.).

### Changes

**1. `supabase/functions/export-user-data/index.ts`**
- Update CORS headers to include all required client headers
- Replace `getUser()` with `getClaims()` for token validation
- Use `claims.sub` for the user ID instead of `user.id`
- Use service role client to fetch the user email separately

**2. `src/pages/Settings.tsx`** — Minor improvement
- Remove the redundant explicit `Authorization` header from `supabase.functions.invoke` (the SDK sends it automatically and the duplicate can cause issues)

### Technical Detail
The `getClaims(token)` method verifies the JWT locally using signing keys, which is the correct approach for this project's configuration. `getUser()` makes a server call that can fail with signing-key mismatches.

