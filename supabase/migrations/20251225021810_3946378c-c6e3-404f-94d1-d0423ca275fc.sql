-- Create active_trips table to track ongoing trips
CREATE TABLE public.active_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  last_position JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Enable RLS on active_trips
ALTER TABLE public.active_trips ENABLE ROW LEVEL SECURITY;

-- RLS policies for active_trips
CREATE POLICY "Users can view active trips they're part of"
ON public.active_trips
FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.convoy_members cm 
    WHERE cm.trip_id = active_trips.trip_id 
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own active trips"
ON public.active_trips
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create convoy_invites table
CREATE TABLE public.convoy_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID NOT NULL,
  invitee_id UUID,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on convoy_invites
ALTER TABLE public.convoy_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for convoy_invites
CREATE POLICY "Anyone can view invite by code"
ON public.convoy_invites
FOR SELECT
USING (true);

CREATE POLICY "Trip owner can create invites"
ON public.convoy_invites
FOR INSERT
WITH CHECK (
  auth.uid() = inviter_id AND
  EXISTS (
    SELECT 1 FROM public.trips t 
    WHERE t.id = trip_id 
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Inviter or invitee can update invite"
ON public.convoy_invites
FOR UPDATE
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Inviter can delete invite"
ON public.convoy_invites
FOR DELETE
USING (auth.uid() = inviter_id);

-- Add status and invite_code to convoy_members
ALTER TABLE public.convoy_members 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'accepted', 'active', 'left')),
ADD COLUMN IF NOT EXISTS invite_id UUID REFERENCES public.convoy_invites(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_convoy_invites_code ON public.convoy_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_convoy_invites_trip ON public.convoy_invites(trip_id);
CREATE INDEX IF NOT EXISTS idx_active_trips_trip ON public.active_trips(trip_id);
CREATE INDEX IF NOT EXISTS idx_active_trips_user ON public.active_trips(user_id);

-- Enable realtime on convoy_members and active_trips
ALTER PUBLICATION supabase_realtime ADD TABLE public.convoy_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_trips;

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_active_trips_updated_at
BEFORE UPDATE ON public.active_trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_convoy_invites_updated_at
BEFORE UPDATE ON public.convoy_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();