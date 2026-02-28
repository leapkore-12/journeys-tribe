

## Apply Scrolling Fix Across All Pages

Pages that need `h-full` added to the outer container and/or `flex-1 overflow-y-auto` wrapper around content. These pages currently use `flex flex-col bg-background` or `min-h-screen bg-background` without proper scroll containment.

### Pages to Fix (14 pages)

**Pattern A — `flex flex-col bg-background` missing `h-full` and scroll wrapper:**

1. **src/pages/Profile.tsx** (line 87) — `flex flex-col bg-background pb-24` → `flex flex-col h-full bg-background`, wrap content after header in `flex-1 overflow-y-auto pb-24`
2. **src/pages/Feed.tsx** (line 24) — same pattern
3. **src/pages/Notifications.tsx** (line 464) — same pattern
4. **src/pages/Search.tsx** (line 27) — same pattern
5. **src/pages/Garage.tsx** (line 25) — `flex flex-col bg-background pb-24` → same fix
6. **src/pages/UserProfile.tsx** (lines 208, 264) — same pattern (multiple return statements)
7. **src/pages/ChangeCredentials.tsx** (line 168) — same pattern
8. **src/pages/EditProfile.tsx** (lines 142, 168) — same pattern
9. **src/pages/ManageTribe.tsx** (line 70) — same pattern
10. **src/pages/Share.tsx** (line 438) — same pattern
11. **src/pages/Subscription.tsx** (line 73) — has `min-h-screen`, remove it, add `h-full` + scroll wrapper

**Pattern B — `min-h-screen bg-background` without flex scroll:**

12. **src/pages/BlockedAccounts.tsx** (line 36) — `min-h-screen bg-background` → `flex flex-col h-full bg-background`, wrap content in scroll wrapper
13. **src/pages/ManageConnections.tsx** (line 105) — same
14. **src/pages/admin/AdminDashboard.tsx** (line 59) — `min-h-screen bg-background pb-20` → `flex flex-col h-full bg-background`, wrap `<main>` in `flex-1 overflow-y-auto`

**Pattern C — `min-h-screen` with flex but needs `h-full`:**

15. **src/pages/JoinConvoy.tsx** (line 48) — `min-h-screen bg-background flex flex-col` → `flex flex-col h-full bg-background`
16. **src/pages/ConvoyVehicleSelect.tsx** (line 62) — same

### What each fix looks like

For every page:
1. Outer div: change to `flex flex-col h-full bg-background` (remove `min-h-screen`, `pb-XX`, `safe-bottom`)
2. Keep header as-is (sticky)
3. Wrap everything after header in `<div className="flex-1 overflow-y-auto pb-24">` (or `pb-32` for admin pages with bottom nav)
4. Move any bottom padding (`pb-24`) from outer div into the scroll wrapper

