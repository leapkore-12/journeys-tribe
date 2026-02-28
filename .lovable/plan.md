

## Fix Subscription Plan Card Visibility on Create User Page

### Problem
The Subscription Plan card and Create User button are hidden behind the bottom navigation bar. The `pb-20` padding on the container is not enough to account for the bottom nav plus safe area on iOS, causing the radio buttons and submit button to be cut off or show as a white box.

### Solution

**File: `src/pages/admin/CreateUser.tsx`**

1. Increase bottom padding from `pb-20` to `pb-32` to ensure the Subscription Plan card and Create User button are fully visible above the bottom nav
2. Add `mb-4` margin below the submit button for extra breathing room

This is a simple spacing fix - the content is there but gets clipped by the fixed bottom navigation bar on mobile devices.

