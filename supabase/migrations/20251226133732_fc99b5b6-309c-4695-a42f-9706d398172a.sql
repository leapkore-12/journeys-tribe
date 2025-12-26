-- Drop duplicate triggers on follow_requests table
DROP TRIGGER IF EXISTS on_follow_request_notify ON public.follow_requests;
DROP TRIGGER IF EXISTS on_follow_request_accepted_notify ON public.follow_requests;

-- Drop duplicate trigger on follows table
DROP TRIGGER IF EXISTS on_follow_notify ON public.follows;