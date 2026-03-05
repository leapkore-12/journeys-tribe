

## Plan: Fix "Following" Tab Not Clickable in Invite Sheet

### Root Cause

When the user taps "Invite" from the Convoy Members panel, both the Convoy Panel sheet and the InviteMembersSheet render at `z-50`. The Convoy Panel's backdrop and inner container sit at the same stacking level, intercepting touch/click events on the InviteMembersSheet tabs.

### Fix

**`src/components/convoy/InviteMembersSheet.tsx`**:
- Change the overlay `z-50` to `z-[60]` so the Invite sheet renders above the Convoy Panel sheet and receives all pointer events correctly.

This is a single class change on line 128:
```
className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
```

### Why This Works

The Convoy Panel sheet (in `ActiveTrip.tsx` line 719) uses `z-50`. When InviteMembersSheet also uses `z-50`, DOM order determines stacking -- but touch event propagation through overlapping backdrop layers causes the tabs to be unresponsive. Bumping to `z-[60]` ensures the invite sheet is definitively on top.

