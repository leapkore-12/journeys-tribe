-- Create function to deactivate convoy members when trip ends
CREATE OR REPLACE FUNCTION public.deactivate_convoy_members_on_trip_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'cancelled') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'cancelled')) THEN
    UPDATE public.convoy_members 
    SET status = 'left'
    WHERE trip_id = NEW.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run the function when trip status changes
CREATE TRIGGER on_trip_end_deactivate_convoy
AFTER UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.deactivate_convoy_members_on_trip_end();

-- Enable realtime for trips table so convoy members get notified of trip status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;