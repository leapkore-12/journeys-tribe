

## Fix: Add route for viewing another user's garage

### Problem
`UserProfile` navigates to `/user/${userId}/garage`, but no such route exists — only `/garage` (own garage). This causes a 404.

### Changes

**1. `src/App.tsx`** — Add a new route `/user/:userId/garage` pointing to the Garage component.

**2. `src/pages/Garage.tsx`** — Accept an optional `userId` URL param via `useParams()`:
- If `userId` is present, fetch that user's vehicles and profile (read-only view).
- Hide the "+" add button and "Edit" links when viewing another user's garage.
- Change the back button to navigate to `/user/${userId}` instead of `/profile`.
- The existing empty state message ("No vehicles yet") already exists — just update the text to "This user hasn't added any vehicles yet" when viewing someone else's garage, and hide the "Add Vehicle" button.

