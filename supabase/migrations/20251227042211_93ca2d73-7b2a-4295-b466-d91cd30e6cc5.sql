-- Fix existing duplicate active trips: keep only the most recent per user
-- First, mark all but the latest active trip as completed
WITH ranked_trips AS (
  SELECT id, user_id, 
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY started_at DESC NULLS LAST, created_at DESC) as rn
  FROM trips 
  WHERE status = 'active'
)
UPDATE trips 
SET status = 'completed', completed_at = now()
WHERE id IN (
  SELECT id FROM ranked_trips WHERE rn > 1
);

-- Also set convoy_members status to 'left' for those completed trips
UPDATE convoy_members
SET status = 'left'
WHERE trip_id IN (
  SELECT id FROM trips WHERE status = 'completed' AND completed_at > now() - interval '1 minute'
)
AND status = 'active';

-- Create a partial unique index to prevent multiple active trips per user in the future
-- This allows NULL statuses and other statuses, but only one 'active' trip per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_trip_per_user 
ON trips (user_id) 
WHERE status = 'active';