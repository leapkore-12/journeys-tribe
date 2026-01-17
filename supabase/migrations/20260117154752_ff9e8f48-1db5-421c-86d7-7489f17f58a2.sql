-- Add GDPR consent fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS analytics_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_updated_at timestamp with time zone;