-- Update can_view_trip function to include convoy members
CREATE OR REPLACE FUNCTION public.can_view_trip(_viewer_id uuid, _trip_user_id uuid, _visibility text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      -- Owner can always see their own trips
      WHEN _viewer_id = _trip_user_id THEN true
      -- Convoy members can always see the trip they're part of
      WHEN EXISTS (
        SELECT 1 FROM public.convoy_members cm
        JOIN public.trips t ON t.id = cm.trip_id
        WHERE cm.user_id = _viewer_id 
          AND t.user_id = _trip_user_id
          AND cm.status = 'active'
      ) THEN true
      -- Check if account is private - if so, only followers can see ANY trips
      WHEN is_profile_private(_trip_user_id) = true THEN 
        is_following(_viewer_id, _trip_user_id)
      -- Public account: use trip visibility setting
      WHEN _visibility = 'public' THEN true
      WHEN _visibility = 'followers' THEN is_following(_viewer_id, _trip_user_id)
      WHEN _visibility = 'tribe' THEN is_tribe_member(_trip_user_id, _viewer_id)
      WHEN _visibility = 'private' THEN false
      ELSE false
    END
$$;