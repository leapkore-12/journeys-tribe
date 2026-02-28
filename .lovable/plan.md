

## Create a Manage Notifications Settings Page

Currently "Manage notifications" just navigates to the notifications inbox. It needs its own dedicated page with toggles to control which notifications the user receives.

### 1. Database Migration — Add notification preference columns to `profiles`

Add these boolean columns (all defaulting to `true`):
- `notify_likes` — receive notifications when someone likes your trip
- `notify_comments` — receive notifications on comments
- `notify_follows` — receive notifications for follow requests/accepts
- `notify_convoy_invites` — receive notifications for convoy invites

### 2. New Page — `src/pages/NotificationSettings.tsx`

A settings-style page with:
- Back arrow header titled "Manage Notifications"
- Toggle switches for each notification type:
  - **Likes** — "Get notified when someone likes your trip"
  - **Comments** — "Get notified when someone comments on your trip"
  - **Follows** — "Get notified about follow requests"
  - **Convoy Invites** — "Get notified about convoy invitations"
- Each toggle reads from and writes to the user's profile

### 3. Update `src/pages/Settings.tsx`

Change the "Manage notifications" item to navigate to `/settings/notifications` instead of `/notifications`.

### 4. Update `src/App.tsx`

Add route: `/settings/notifications` → `NotificationSettings`

### 5. Update notification triggers (optional enhancement)

The database triggers that create notifications (`notify_on_trip_like`, `notify_on_comment`, `notify_on_follow_request_accepted`) should check the recipient's preference before inserting. This ensures toggling off actually stops notifications.

