-- Security fixes for RendaCast

-- 1. Fix profiles table - restrict SELECT to own profile or admin
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 2. Remove dangerous RLS policy from rate_limit_tracking
-- This table should only be accessed via service role, not through RLS
DROP POLICY IF EXISTS "system_manage_rate_limits" ON public.rate_limit_tracking;

-- 3. Remove public INSERT policy from upload_logs
-- Only system (via service role) should insert logs
DROP POLICY IF EXISTS "system_insert_logs" ON public.upload_logs;

-- 4. Add policy to prevent user_id exposure in reviews for non-owners
-- Keep public visibility but create a view that anonymizes user_id for public consumption
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT 
  id,
  audiobook_id,
  rating,
  review_text,
  created_at,
  updated_at,
  CASE 
    WHEN auth.uid() = user_id THEN user_id
    ELSE NULL
  END as user_id
FROM public.reviews;

-- Grant access to the view
GRANT SELECT ON public.public_reviews TO authenticated, anon;