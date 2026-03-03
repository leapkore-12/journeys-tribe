

## Plan: Fix Invite Button & Add Direct Invite to Tribe/Followers

### Problem

Two issues:

1. **Invite button fails (RLS error)**: The current `handleShareInvite` creates a `convoy_invites` row, but the RLS policy only allows **trip owners** or **convoy leaders** to insert. If the user is a convoy member (non-leader), it fails silently with "Invite failed."

2. **No way to directly invite tribe/followers**: The current invite flow only generates a shareable link (via `navigator.share` or clipboard). Users want to **pick people from their tribe or followers** and send them direct invites that appear as notifications with Accept/Decline buttons.

### Changes

#### 1. New Component: `InviteMembersSheet.tsx`
A bottom sheet that opens when the user taps "Invite" on the ActiveTrip page. It shows:
- **Two tabs**: "Tribe" and "Followers"
- Each tab lists users with avatar, name, and an "Invite" button
- Already-invited or already-in-convoy users show a disabled "Invited"/"Joined" badge
- A "Share Link" button at the bottom for the existing link-sharing flow
- Uses `useTribe` and `useFollows` hooks to fetch lists

#### 2. Update `useConvoyInvites.ts` — `createBulkInvites`
The existing `createBulkInvites` mutation already supports sending invites with `invitee_id` set (which triggers the `notify_on_convoy_invite` database trigger to create notifications). This is the right mechanism — just needs to be wired up to the new UI.

#### 3. Update `ActiveTrip.tsx`
- Replace `handleShareInvite` with opening the new `InviteMembersSheet`
- The sheet handles both direct invites (via `createBulkInvites`) and link sharing (via existing `createInvite` + share)

#### 4. Fix RLS Policy (if needed)
The current RLS INSERT policy on `convoy_invites` requires the user to be the trip owner OR a convoy leader (`is_leader = true`). This is correct — only leaders should invite. But we need to verify the user's `is_leader` status is set properly when they start a trip (trip owner should automatically be a convoy member with `is_leader = true`).

Let me check: the error happens because when the **trip owner** starts a trip, they may not have a corresponding `convoy_members` row with `is_leader = true`, and the RLS check for `trips.user_id = auth.uid()` should cover them. The more likely issue is that `activeTripId` resolves to a trip the user doesn't own (e.g., via `activeConvoy.trip_id`), or the trip's `user_id` doesn't match.

We should add better error logging in the catch block to surface the actual Supabase error, and ensure the trip owner path works.

### Technical Details

**`src/components/convoy/InviteMembersSheet.tsx`** (new file):
- Props: `isOpen`, `onClose`, `tripId`, `existingMemberIds`
- Tabs for Tribe / Followers using existing hooks
- Each row: avatar, display name, invite button
- On invite: call `createBulkInvites` with selected `invitee_id`s
- Footer: "Share Link" button for link-based invite

**`src/pages/ActiveTrip.tsx`**:
- Add state `showInviteSheet`
- Replace `handleShareInvite` → open the sheet
- Pass `activeTripId` and current member IDs to the sheet
- Improve error handling: log the actual error from `createInvite`

**`src/hooks/useConvoyInvites.ts`**:
- Minor: improve error messages in `createInvite` and `createBulkInvites` to surface the actual DB error

**Database**: No schema changes needed. The `convoy_invites` table already supports `invitee_id`, and the `notify_on_convoy_invite` trigger already fires on insert to create notifications. The Notifications page already has Accept/Decline buttons for `convoy_invite` type notifications.

