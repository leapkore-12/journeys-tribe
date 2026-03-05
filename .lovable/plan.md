

## Plan: Fix Following Tab & Remove Share Button

### Problem
1. The "Following" tab in the Invite Members sheet is unresponsive on iOS because the Convoy Panel backdrop (`z-50`) remains open behind the Invite Sheet (`z-[60]`), causing iOS Safari to intercept touch events on the overlapping fixed layers.
2. The "Share Invite Link" button fails on iOS and is redundant since users invite directly from the tabs.

### Changes

**`src/pages/ActiveTrip.tsx`** (line 741):
- When the Invite button is tapped, **close the Convoy Panel first**, then open the Invite Sheet. This eliminates the overlapping backdrop that swallows touch events on iOS.
- Change: `onClick={() => setShowInviteSheet(true)}` → `onClick={() => { setShowConvoyPanel(false); setShowInviteSheet(true); }}`

**`src/components/convoy/InviteMembersSheet.tsx`**:
1. Remove the entire "Share Invite Link" footer section (lines 207-222).
2. Remove unused imports: `Share2` from lucide, and `createInvite`, `copyInviteLink`, `getShareLink` from the hook destructuring.
3. Remove the `handleShareLink` function (lines 90-106).
4. Add safe-area bottom padding to the tab content container instead.

### Why This Fixes the Tab Issue
On iOS Safari, two overlapping `fixed inset-0` elements with `backdrop-blur` cause the lower layer to intercept pointer events even when z-indexes are correct. By closing the Convoy Panel before opening the Invite Sheet, there's only one backdrop layer, so all touch events reach the tabs correctly.

