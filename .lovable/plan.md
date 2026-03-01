

## Fix Empty Space on Create User Page

### Problem
The Create User page has a large empty gap between the "Create User" button and the bottom navigation bar. The `pb-32` padding on `<main>` combined with `flex-1 overflow-y-auto` on the scroll wrapper creates excessive whitespace below the button.

### Solution — `src/pages/admin/CreateUser.tsx`

1. **Reduce bottom padding** — Change `pb-32` to `pb-20` on the `<main>` element. The `pb-32` was overly generous; `pb-20` provides just enough clearance above the fixed bottom nav (h-16 = 4rem = ~64px, pb-20 = 5rem = 80px).

2. **Remove `mb-4` from the submit button** — The extra margin below the button adds unnecessary space at the bottom of the form.

### Files changed
1. `src/pages/admin/CreateUser.tsx` — Change `pb-32` to `pb-20` on main, remove `mb-4` from Button

