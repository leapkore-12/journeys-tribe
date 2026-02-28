

## Restrict Road Hazard Visibility to Trip Owner and Convoy Members

### Current State
The `road_hazards` SELECT policy allows **any authenticated user** to view non-expired hazards:
```sql
USING (expires_at > now())
```

### Change — Single Migration

Drop and recreate the SELECT policy to require the viewer to be either the trip owner or an active convoy member:

```sql
DROP POLICY "Anyone can view active hazards" ON public.road_hazards;

CREATE POLICY "Trip owner and convoy members can view hazards"
ON public.road_hazards
FOR SELECT
TO authenticated
USING (
  expires_at > now()
  AND (
    -- Reporter can always see their own hazards
    auth.uid() = reporter_id
    OR
    -- Trip owner
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = road_hazards.trip_id
        AND t.user_id = auth.uid()
    )
    OR
    -- Active convoy member
    EXISTS (
      SELECT 1 FROM convoy_members cm
      WHERE cm.trip_id = road_hazards.trip_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  )
);
```

No frontend code changes needed — the `useRoadHazards` hook already filters by `trip_id`.

