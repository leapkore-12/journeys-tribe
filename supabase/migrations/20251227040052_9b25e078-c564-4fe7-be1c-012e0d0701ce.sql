-- Allow users to join convoy if they have a valid pending invite
CREATE POLICY "Invitees can join convoy via valid invite"
ON public.convoy_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.convoy_invites ci
    WHERE ci.trip_id = convoy_members.trip_id
      AND ci.status = 'pending'
      AND ci.expires_at > now()
      AND (ci.invitee_id = auth.uid() OR ci.invitee_id IS NULL)
  )
);

-- Allow members to update their own convoy membership
CREATE POLICY "Members can update own membership"
ON public.convoy_members
FOR UPDATE
USING (user_id = auth.uid());

-- Allow members to leave convoy
CREATE POLICY "Members can leave convoy"
ON public.convoy_members
FOR DELETE
USING (user_id = auth.uid());