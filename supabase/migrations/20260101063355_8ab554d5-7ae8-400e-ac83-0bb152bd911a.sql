-- Create road_hazards table for reporting road hazards
CREATE TABLE public.road_hazards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  hazard_type TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '2 hours')
);

-- Enable RLS
ALTER TABLE public.road_hazards ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active hazards"
ON public.road_hazards
FOR SELECT
USING (expires_at > now());

CREATE POLICY "Authenticated users can report hazards"
ON public.road_hazards
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can delete their own hazards"
ON public.road_hazards
FOR DELETE
USING (auth.uid() = reporter_id);

-- Enable realtime for hazards
ALTER PUBLICATION supabase_realtime ADD TABLE public.road_hazards;