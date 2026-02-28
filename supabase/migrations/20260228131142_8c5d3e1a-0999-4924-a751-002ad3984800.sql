
-- Add notification preference columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN notify_likes boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_comments boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_follows boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_convoy_invites boolean NOT NULL DEFAULT true;

-- Update notify_on_trip_like to check preference
CREATE OR REPLACE FUNCTION public.notify_on_trip_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trip_owner_id UUID;
  actor_name TEXT;
  should_notify BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO trip_owner_id FROM public.trips WHERE id = NEW.trip_id;
    IF trip_owner_id IS NOT NULL AND trip_owner_id != NEW.user_id THEN
      SELECT notify_likes INTO should_notify FROM public.profiles WHERE id = trip_owner_id;
      IF should_notify IS DISTINCT FROM false THEN
        SELECT COALESCE(display_name, username, 'Someone') INTO actor_name FROM public.profiles WHERE id = NEW.user_id;
        INSERT INTO public.notifications (user_id, actor_id, type, trip_id, message)
        VALUES (trip_owner_id, NEW.user_id, 'like', NEW.trip_id, actor_name || ' liked your trip');
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT user_id INTO trip_owner_id FROM public.trips WHERE id = OLD.trip_id;
    DELETE FROM public.notifications WHERE actor_id = OLD.user_id AND trip_id = OLD.trip_id AND type = 'like';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update notify_on_comment to check preference
CREATE OR REPLACE FUNCTION public.notify_on_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trip_owner_id UUID;
  actor_name TEXT;
  should_notify BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO trip_owner_id FROM public.trips WHERE id = NEW.trip_id;
    IF trip_owner_id IS NOT NULL AND trip_owner_id != NEW.user_id THEN
      SELECT notify_comments INTO should_notify FROM public.profiles WHERE id = trip_owner_id;
      IF should_notify IS DISTINCT FROM false THEN
        SELECT COALESCE(display_name, username, 'Someone') INTO actor_name FROM public.profiles WHERE id = NEW.user_id;
        INSERT INTO public.notifications (user_id, actor_id, type, trip_id, message)
        VALUES (trip_owner_id, NEW.user_id, 'comment', NEW.trip_id, actor_name || ' commented on your trip');
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT user_id INTO trip_owner_id FROM public.trips WHERE id = OLD.trip_id;
    DELETE FROM public.notifications WHERE actor_id = OLD.user_id AND trip_id = OLD.trip_id AND type = 'comment';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update notify_on_follow to check preference
CREATE OR REPLACE FUNCTION public.notify_on_follow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actor_name TEXT;
  should_notify BOOLEAN;
BEGIN
  SELECT notify_follows INTO should_notify FROM public.profiles WHERE id = NEW.following_id;
  IF should_notify IS DISTINCT FROM false THEN
    SELECT COALESCE(display_name, username, 'Someone') INTO actor_name FROM public.profiles WHERE id = NEW.follower_id;
    INSERT INTO public.notifications (user_id, actor_id, type, message)
    VALUES (NEW.following_id, NEW.follower_id, 'follow', actor_name || ' started following you');
  END IF;
  RETURN NEW;
END;
$function$;

-- Update notify_on_follow_request to check preference
CREATE OR REPLACE FUNCTION public.notify_on_follow_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actor_name TEXT;
  should_notify BOOLEAN;
BEGIN
  SELECT notify_follows INTO should_notify FROM public.profiles WHERE id = NEW.target_id;
  IF should_notify IS DISTINCT FROM false THEN
    SELECT COALESCE(display_name, username, 'Someone') INTO actor_name FROM public.profiles WHERE id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, actor_id, type, message)
    VALUES (NEW.target_id, NEW.requester_id, 'follow_request', actor_name || ' requested to follow you');
  END IF;
  RETURN NEW;
END;
$function$;

-- Update notify_on_follow_request_accepted to check preference
CREATE OR REPLACE FUNCTION public.notify_on_follow_request_accepted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actor_name TEXT;
  should_notify BOOLEAN;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT notify_follows INTO should_notify FROM public.profiles WHERE id = NEW.requester_id;
    IF should_notify IS DISTINCT FROM false THEN
      SELECT COALESCE(display_name, username, 'Someone') INTO actor_name FROM public.profiles WHERE id = NEW.target_id;
      INSERT INTO public.notifications (user_id, actor_id, type, message)
      VALUES (NEW.requester_id, NEW.target_id, 'follow_accepted', actor_name || ' accepted your follow request');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update notify_on_convoy_invite to check preference
CREATE OR REPLACE FUNCTION public.notify_on_convoy_invite()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actor_name TEXT;
  should_notify BOOLEAN;
BEGIN
  IF NEW.invitee_id IS NOT NULL THEN
    SELECT notify_convoy_invites INTO should_notify FROM public.profiles WHERE id = NEW.invitee_id;
    IF should_notify IS DISTINCT FROM false THEN
      SELECT COALESCE(display_name, username, 'Someone') INTO actor_name FROM public.profiles WHERE id = NEW.inviter_id;
      INSERT INTO public.notifications (user_id, actor_id, type, trip_id, message)
      VALUES (NEW.invitee_id, NEW.inviter_id, 'convoy_invite', NEW.trip_id, actor_name || ' invited you to join a convoy');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
