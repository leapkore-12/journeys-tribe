-- Add vehicle_id column to convoy_members table
ALTER TABLE public.convoy_members 
ADD COLUMN vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;