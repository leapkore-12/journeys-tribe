-- Create trigger function for convoy invite notifications
CREATE OR REPLACE FUNCTION public.notify_on_convoy_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  actor_name TEXT;
BEGIN
  -- Only create notification if invitee_id is set
  IF NEW.invitee_id IS NOT NULL THEN
    SELECT COALESCE(display_name, username, 'Someone') INTO actor_name 
    FROM public.profiles WHERE id = NEW.inviter_id;
    
    INSERT INTO public.notifications (user_id, actor_id, type, trip_id, message)
    VALUES (
      NEW.invitee_id, 
      NEW.inviter_id, 
      'convoy_invite', 
      NEW.trip_id,
      actor_name || ' invited you to join a convoy'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for convoy invite notifications
DROP TRIGGER IF EXISTS on_convoy_invite_created ON public.convoy_invites;
CREATE TRIGGER on_convoy_invite_created
  AFTER INSERT ON public.convoy_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_convoy_invite();