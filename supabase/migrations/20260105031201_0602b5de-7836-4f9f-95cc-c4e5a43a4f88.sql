-- Allow users to check if they are blocked by someone
CREATE POLICY "Users can check if they are blocked"
ON public.blocked_users
FOR SELECT
USING (auth.uid() = blocked_id);