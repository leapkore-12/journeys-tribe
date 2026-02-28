

## Allow Convoy Leaders to Create Invites

### Current State
The `convoy_invites` INSERT policy only allows trip owners:
```sql
(auth.uid() = inviter_id) AND (EXISTS (SELECT 1 FROM trips t WHERE t.id = convoy_invites.trip_id AND t.user_id = auth.uid()))
```

### Change — Single Migration

Drop and recreate the INSERT policy on `convoy_invites` to also check if the user is a convoy leader for that trip:

```sql
DROP POLICY "Trip owner can create invites" ON public.convoy_invites;

CREATE POLICY "Trip owner or convoy leader can create invites"
ON public.convoy_invites
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = inviter_id
  AND (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM convoy_members cm WHERE cm.trip_id = convoy_invites.trip_id AND cm.user_id = auth.uid() AND cm.is_leader = true AND cm.status = 'active')
  )
);
```

No code changes needed — the frontend already passes `auth.uid()` as `inviter_id` and the trip ID correctly.

