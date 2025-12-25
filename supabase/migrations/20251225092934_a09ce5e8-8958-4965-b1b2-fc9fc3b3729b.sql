-- Add plan_type to profiles (free/paid) and monthly trip tracking
ALTER TABLE public.profiles 
ADD COLUMN plan_type text NOT NULL DEFAULT 'free',
ADD COLUMN monthly_trip_count integer DEFAULT 0,
ADD COLUMN monthly_trip_reset_at timestamptz DEFAULT date_trunc('month', now()) + interval '1 month';

-- Add visibility column to trips for granular access control
ALTER TABLE public.trips 
ADD COLUMN visibility text NOT NULL DEFAULT 'public';

-- Add is_leader flag to convoy_members
ALTER TABLE public.convoy_members 
ADD COLUMN is_leader boolean DEFAULT false;

-- Create helper function for checking if user can see tribe-visibility trips
CREATE OR REPLACE FUNCTION public.can_view_trip(_viewer_id uuid, _trip_user_id uuid, _visibility text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN _visibility = 'public' THEN true
      WHEN _visibility = 'followers' THEN (is_following(_viewer_id, _trip_user_id) OR _viewer_id = _trip_user_id)
      WHEN _visibility = 'tribe' THEN (is_tribe_member(_trip_user_id, _viewer_id) OR _viewer_id = _trip_user_id)
      WHEN _visibility = 'private' THEN _viewer_id = _trip_user_id
      ELSE false
    END
$$;

-- Drop existing SELECT policy on trips
DROP POLICY IF EXISTS "Public trips are viewable by everyone" ON public.trips;

-- Create new RLS policy for trips that respects visibility column
CREATE POLICY "Trips visible based on visibility setting" ON public.trips
FOR SELECT USING (
  can_view_trip(auth.uid(), user_id, visibility)
);

-- Add function to update convoy leader
CREATE OR REPLACE FUNCTION public.transfer_convoy_leadership(_trip_id uuid, _new_leader_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove current leader flag from all members
  UPDATE public.convoy_members
  SET is_leader = false
  WHERE trip_id = _trip_id;
  
  -- Set new leader
  UPDATE public.convoy_members
  SET is_leader = true
  WHERE trip_id = _trip_id AND user_id = _new_leader_id;
END;
$$;