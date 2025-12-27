-- Create function to cancel pending invites when trip completes
CREATE OR REPLACE FUNCTION public.cancel_pending_invites_on_trip_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.convoy_invites 
    SET status = 'cancelled', updated_at = now()
    WHERE trip_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on trips table
CREATE TRIGGER on_trip_complete_cancel_invites
AFTER UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.cancel_pending_invites_on_trip_complete();