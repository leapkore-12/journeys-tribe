-- Function to handle comment notifications
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trip_owner_id UUID;
  actor_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the trip owner
    SELECT user_id INTO trip_owner_id FROM public.trips WHERE id = NEW.trip_id;
    
    -- Don't notify if user comments on their own trip
    IF trip_owner_id IS NOT NULL AND trip_owner_id != NEW.user_id THEN
      SELECT COALESCE(display_name, username, 'Someone') INTO actor_name 
      FROM public.profiles WHERE id = NEW.user_id;
      
      INSERT INTO public.notifications (user_id, actor_id, type, trip_id, message)
      VALUES (trip_owner_id, NEW.user_id, 'comment', NEW.trip_id, actor_name || ' commented on your trip');
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Get the trip owner
    SELECT user_id INTO trip_owner_id FROM public.trips WHERE id = OLD.trip_id;
    
    -- Delete the comment notification
    DELETE FROM public.notifications 
    WHERE actor_id = OLD.user_id 
      AND trip_id = OLD.trip_id 
      AND type = 'comment';
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers for comment notifications
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

CREATE TRIGGER on_comment_delete
  AFTER DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();