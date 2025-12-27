-- Function to update profile stats when user joins/leaves convoy
CREATE OR REPLACE FUNCTION public.update_convoy_member_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trip_distance numeric;
  trip_duration integer;
BEGIN
  -- Only process for non-leader members (leaders are trip owners who already have stats counted)
  IF (TG_OP = 'INSERT' AND NEW.is_leader = false AND NEW.status = 'active') THEN
    -- Get trip stats
    SELECT distance_km, duration_minutes INTO trip_distance, trip_duration 
    FROM public.trips WHERE id = NEW.trip_id;
    
    -- Add to convoy member's stats
    UPDATE public.profiles 
    SET 
      trips_count = trips_count + 1,
      total_distance_km = total_distance_km + COALESCE(trip_distance, 0),
      total_duration_minutes = total_duration_minutes + COALESCE(trip_duration, 0),
      updated_at = now()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Handle status change to 'left' (untagging)
    IF NEW.is_leader = false AND OLD.status IN ('active', 'completed') AND NEW.status = 'left' THEN
      -- Get trip stats
      SELECT distance_km, duration_minutes INTO trip_distance, trip_duration 
      FROM public.trips WHERE id = NEW.trip_id;
      
      -- Subtract from convoy member's stats
      UPDATE public.profiles 
      SET 
        trips_count = GREATEST(0, trips_count - 1),
        total_distance_km = GREATEST(0, total_distance_km - COALESCE(trip_distance, 0)),
        total_duration_minutes = GREATEST(0, total_duration_minutes - COALESCE(trip_duration, 0)),
        updated_at = now()
      WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'DELETE' AND OLD.is_leader = false) THEN
    -- Get trip stats
    SELECT distance_km, duration_minutes INTO trip_distance, trip_duration 
    FROM public.trips WHERE id = OLD.trip_id;
    
    -- Subtract from convoy member's stats
    UPDATE public.profiles 
    SET 
      trips_count = GREATEST(0, trips_count - 1),
      total_distance_km = GREATEST(0, total_distance_km - COALESCE(trip_distance, 0)),
      total_duration_minutes = GREATEST(0, total_duration_minutes - COALESCE(trip_duration, 0)),
      updated_at = now()
    WHERE id = OLD.user_id;
    
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on convoy_members table
CREATE TRIGGER on_convoy_member_change
  AFTER INSERT OR UPDATE OR DELETE ON public.convoy_members
  FOR EACH ROW EXECUTE FUNCTION public.update_convoy_member_stats();