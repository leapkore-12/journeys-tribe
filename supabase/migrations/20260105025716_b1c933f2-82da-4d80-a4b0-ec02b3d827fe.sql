-- Create trigger function to remove follows when a user is blocked
CREATE OR REPLACE FUNCTION public.remove_follows_on_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove follow where blocker follows blocked
  DELETE FROM public.follows 
  WHERE follower_id = NEW.blocker_id AND following_id = NEW.blocked_id;
  
  -- Remove follow where blocked follows blocker
  DELETE FROM public.follows 
  WHERE follower_id = NEW.blocked_id AND following_id = NEW.blocker_id;
  
  -- Remove any pending follow requests between them (both directions)
  DELETE FROM public.follow_requests 
  WHERE (requester_id = NEW.blocker_id AND target_id = NEW.blocked_id)
     OR (requester_id = NEW.blocked_id AND target_id = NEW.blocker_id);
  
  -- Clean up any follow-related notifications between them
  DELETE FROM public.notifications
  WHERE ((actor_id = NEW.blocker_id AND user_id = NEW.blocked_id)
     OR (actor_id = NEW.blocked_id AND user_id = NEW.blocker_id))
    AND type IN ('follow', 'follow_request', 'follow_accepted');
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after blocking a user
CREATE TRIGGER on_block_remove_follows
  AFTER INSERT ON public.blocked_users
  FOR EACH ROW
  EXECUTE FUNCTION public.remove_follows_on_block();