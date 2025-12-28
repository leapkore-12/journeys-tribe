-- Drop existing policy
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

-- Create new policy that allows:
-- 1. Unfollowing someone (where you are the follower)
-- 2. Removing a follower (where you are being followed)
CREATE POLICY "Users can manage their follow relationships" 
ON public.follows
FOR DELETE
USING (auth.uid() = follower_id OR auth.uid() = following_id);