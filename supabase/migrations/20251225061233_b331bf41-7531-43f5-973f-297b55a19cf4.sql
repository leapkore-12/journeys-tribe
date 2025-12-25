-- Create trigger function for new follow notification
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name TEXT;
BEGIN
  SELECT COALESCE(display_name, username, 'Someone') INTO actor_name 
  FROM public.profiles WHERE id = NEW.follower_id;
  
  INSERT INTO public.notifications (user_id, actor_id, type, message)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', actor_name || ' started following you');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new follows
DROP TRIGGER IF EXISTS on_follow_notify ON public.follows;
CREATE TRIGGER on_follow_notify
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- Create trigger function for follow request notification
CREATE OR REPLACE FUNCTION public.notify_on_follow_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name TEXT;
BEGIN
  SELECT COALESCE(display_name, username, 'Someone') INTO actor_name 
  FROM public.profiles WHERE id = NEW.requester_id;
  
  INSERT INTO public.notifications (user_id, actor_id, type, message)
  VALUES (NEW.target_id, NEW.requester_id, 'follow_request', actor_name || ' requested to follow you');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new follow requests
DROP TRIGGER IF EXISTS on_follow_request_notify ON public.follow_requests;
CREATE TRIGGER on_follow_request_notify
AFTER INSERT ON public.follow_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow_request();

-- Create trigger function for accepted follow request notification
CREATE OR REPLACE FUNCTION public.notify_on_follow_request_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name TEXT;
BEGIN
  -- Only trigger if status changed to 'accepted'
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(display_name, username, 'Someone') INTO actor_name 
    FROM public.profiles WHERE id = NEW.target_id;
    
    INSERT INTO public.notifications (user_id, actor_id, type, message)
    VALUES (NEW.requester_id, NEW.target_id, 'follow_accepted', actor_name || ' accepted your follow request');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for accepted follow requests
DROP TRIGGER IF EXISTS on_follow_request_accepted_notify ON public.follow_requests;
CREATE TRIGGER on_follow_request_accepted_notify
AFTER UPDATE ON public.follow_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow_request_accepted();