

## Fix Spacing on Remaining Admin Pages

### Problem
Dashboard, User Management, and Edit User all use `pb-32` bottom padding, creating the same excessive white space gap above the bottom nav that was just fixed on Create User (`pb-20`).

### Changes

1. **`src/pages/admin/AdminDashboard.tsx`** (line 73) — Change `pb-32` to `pb-20` on the scroll wrapper div.

2. **`src/pages/admin/UserManagement.tsx`** (line 56) — Change `pb-32` to `pb-20` on `<main>`.

3. **`src/pages/admin/EditUser.tsx`** (line 169) — Change `pb-32` to `pb-20` on `<main>`.

All three changes match what was already applied to CreateUser.

