-- Drop the existing constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint with 'follow_accepted' type
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'follow'::text, 
  'follow_request'::text, 
  'follow_accepted'::text,
  'like'::text, 
  'comment'::text, 
  'convoy_invite'::text, 
  'trip_complete'::text
]));