DROP POLICY "Anyone can view active hazards" ON public.road_hazards;

CREATE POLICY "Trip owner and convoy members can view hazards"
ON public.road_hazards
FOR SELECT
TO authenticated
USING (
  expires_at > now()
  AND (
    auth.uid() = reporter_id
    OR
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = road_hazards.trip_id
        AND t.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM convoy_members cm
      WHERE cm.trip_id = road_hazards.trip_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  )
);