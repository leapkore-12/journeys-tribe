-- First, fix the trigger that's setting invalid status on convoy_invites
-- Update it to set status to 'expired' instead of 'cancelled'
CREATE OR REPLACE FUNCTION public.cancel_pending_invites_on_trip_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.convoy_invites 
    SET status = 'expired', updated_at = now()
    WHERE trip_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$function$;