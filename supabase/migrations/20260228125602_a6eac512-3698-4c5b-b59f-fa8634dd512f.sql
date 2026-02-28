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