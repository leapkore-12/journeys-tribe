-- Drop the existing policy
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;

-- Create new policy that allows:
-- 1. Users to follow others directly (for public accounts)
-- 2. Target users to create follow when accepting a request (for private accounts)
CREATE POLICY "Users can follow others" 
  ON public.follows 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = follower_id 
    OR auth.uid() = following_id
  );