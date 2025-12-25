-- Create trigger for follow_request notifications (when request is created)
CREATE OR REPLACE TRIGGER on_follow_request_created
  AFTER INSERT ON public.follow_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_follow_request();

-- Create trigger for follow_accepted notifications (when status changes to accepted)
CREATE OR REPLACE TRIGGER on_follow_request_accepted
  AFTER UPDATE OF status ON public.follow_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
  EXECUTE FUNCTION public.notify_on_follow_request_accepted();

-- Create trigger for follow notifications (when follow is created)
CREATE OR REPLACE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_follow();

-- Create function for trip like notifications
CREATE OR REPLACE FUNCTION public.notify_on_trip_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trip_owner_id UUID;
  actor_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the trip owner
    SELECT user_id INTO trip_owner_id FROM public.trips WHERE id = NEW.trip_id;
    
    -- Don't notify if user likes their own trip
    IF trip_owner_id IS NOT NULL AND trip_owner_id != NEW.user_id THEN
      SELECT COALESCE(display_name, username, 'Someone') INTO actor_name 
      FROM public.profiles WHERE id = NEW.user_id;
      
      INSERT INTO public.notifications (user_id, actor_id, type, trip_id, message)
      VALUES (trip_owner_id, NEW.user_id, 'like', NEW.trip_id, actor_name || ' liked your trip');
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Get the trip owner
    SELECT user_id INTO trip_owner_id FROM public.trips WHERE id = OLD.trip_id;
    
    -- Delete the like notification
    DELETE FROM public.notifications 
    WHERE actor_id = OLD.user_id 
      AND trip_id = OLD.trip_id 
      AND type = 'like';
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers for trip like notifications
CREATE OR REPLACE TRIGGER on_trip_like_created
  AFTER INSERT ON public.trip_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_trip_like();

CREATE OR REPLACE TRIGGER on_trip_like_deleted
  AFTER DELETE ON public.trip_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_trip_like();