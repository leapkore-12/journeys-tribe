

## Fix Scrolling on Admin Pages

### Problem
Admin pages (UserManagement, EditUser, CreateUser) use `min-h-screen` which conflicts with the `MobileContainer` wrapper that constrains height to `h-screen max-h-[932px]` with `overflow-y-auto`. On native iOS, this prevents scrolling past the visible content area, hiding everything below Profile Information on EditUser.

### Solution
Apply the standard iOS scrolling pattern (from memory: `flex flex-col h-full` outer + `flex-1 overflow-y-auto` inner) to all three admin pages, and increase bottom padding where needed.

### Files to Modify

**1. `src/pages/admin/EditUser.tsx` (line 141)**
- Change outer div from `min-h-screen bg-background pb-20` to `flex flex-col h-full bg-background`
- Wrap `<main>` in a scrollable container: `flex-1 overflow-y-auto pb-32`

**2. `src/pages/admin/UserManagement.tsx` (line 35)**
- Change outer div from `min-h-screen bg-background pb-20` to `flex flex-col h-full bg-background`
- Wrap `<main>` in a scrollable container: `flex-1 overflow-y-auto pb-32`

**3. `src/pages/admin/CreateUser.tsx` (line 53)**
- Change outer div from `min-h-screen bg-background pb-32` to `flex flex-col h-full bg-background`
- Wrap `<main>` in a scrollable container: `flex-1 overflow-y-auto pb-32`

This matches the established pattern used on other pages like Settings.tsx to ensure proper scrolling within the fixed iPhone frame.

