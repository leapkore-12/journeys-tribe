

## Fix: Replace `navigate(-1)` with Direct Parent Routes

Every sub-page currently uses `navigate(-1)` (browser history back), which causes unpredictable navigation when users visit multiple sub-pages in sequence. The fix is simple: replace every `handleBack` with a direct `navigate('/parent')` call.

### Changes (21 files, one-liner each)

**Settings sub-pages → `navigate('/settings')`:**
- `src/pages/ManageTribe.tsx`
- `src/pages/TermsOfService.tsx`
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/Help.tsx`
- `src/pages/BlockedAccounts.tsx`
- `src/pages/NotificationSettings.tsx`
- `src/pages/Subscription.tsx`

**Profile sub-pages → `navigate('/profile')`:**
- `src/pages/Settings.tsx`
- `src/pages/Garage.tsx`
- `src/pages/ManageConnections.tsx`

**Feed sub-pages → `navigate('/feed')`:**
- `src/pages/Search.tsx`
- `src/pages/Notifications.tsx`
- `src/pages/Comments.tsx`
- `src/pages/Share.tsx`
- `src/pages/TripDetail.tsx`
- `src/pages/UserProfile.tsx`
- `src/pages/EditTrip.tsx`

**Garage sub-pages → `navigate('/garage')`:**
- `src/pages/EditVehicle.tsx`

**Admin sub-pages → `navigate('/admin/dashboard')`:**
- `src/pages/admin/UserManagement.tsx`
- `src/pages/admin/EditUser.tsx`
- `src/pages/admin/CreateUser.tsx`

### What changes in each file
Replace the `handleBack` function (or inline `navigate(-1)`) with a single `navigate('/parent-route')` call. Remove the `window.history.length` check entirely.

**Already correct** (no changes needed): `EditProfile.tsx`, `ChangeCredentials.tsx`.

