

## Fix Invite Button Not Working

### Root Causes

1. **`activeTripId` can be `null`** — `handleShareInvite` passes `activeTripId` (which is `string | null`) directly to `createInvite.mutateAsync({ tripId: activeTripId })`. When null, the insert fails silently.

2. **Silent failure** — The catch block only does `console.error`, so the user sees no feedback when the invite fails.

3. **No null guard on button** — The invite button is always clickable even when `activeTripId` is null.

### Changes — `src/pages/ActiveTrip.tsx`

**1. Guard `handleShareInvite` against null tripId (line 432-448)**
- Add early return if `!activeTripId`
- Add user-facing toast on error instead of silent `console.error`

```ts
const handleShareInvite = useCallback(async () => {
  if (!activeTripId) {
    toast({ title: 'No active trip', description: 'Cannot create invite without an active trip.', variant: 'destructive' });
    return;
  }
  try {
    const result = await createInvite.mutateAsync({ tripId: activeTripId });
    if (navigator.share) {
      await navigator.share({ ... });
    } else {
      await copyInviteLink(result.invite_code);
    }
  } catch (error) {
    console.error('Share failed:', error);
    toast({ title: 'Invite failed', description: 'Could not create invite. Please try again.', variant: 'destructive' });
  }
}, [createInvite, copyInviteLink, getShareLink, activeTripId, toast]);
```

**2. Disable invite buttons when no tripId (lines 508-509, 733-734)**
- Add `!activeTripId` to the `disabled` prop on both the header share button and the convoy panel invite button

