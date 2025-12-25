-- Create tribe_members table
CREATE TABLE public.tribe_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, member_id)
);

-- Enable RLS
ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;

-- Policies for tribe members
CREATE POLICY "Users can view own tribe"
  ON public.tribe_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to tribe"
  ON public.tribe_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from tribe"
  ON public.tribe_members FOR DELETE
  USING (auth.uid() = user_id);

-- Add tribe_count to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tribe_count integer DEFAULT 0;

-- Create trigger function to update tribe count
CREATE OR REPLACE FUNCTION public.update_tribe_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET tribe_count = tribe_count + 1, updated_at = now() WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET tribe_count = GREATEST(0, tribe_count - 1), updated_at = now() WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER on_tribe_member_change
AFTER INSERT OR DELETE ON public.tribe_members
FOR EACH ROW EXECUTE FUNCTION public.update_tribe_count();

-- Helper function to check if user is in tribe
CREATE OR REPLACE FUNCTION public.is_tribe_member(_user_id uuid, _member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tribe_members
    WHERE user_id = _user_id AND member_id = _member_id
  )
$$;