-- Fix security definer view issue
-- Drop the previous view and recreate without security definer
DROP VIEW IF EXISTS public.public_reviews;

-- Create a simpler approach: reviews remain public but we'll handle anonymization in the application layer
-- The view was causing security issues, so we'll keep the original table structure
-- and handle user_id visibility in the frontend code instead

-- Note: rate_limit_tracking table intentionally has no RLS policies
-- It should only be accessed via service role in edge functions, not by users