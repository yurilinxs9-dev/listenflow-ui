-- Corrigir Security Definer Views para SECURITY INVOKER

-- Drop e recriar views como SECURITY INVOKER
DROP VIEW IF EXISTS public.reviews_public;
DROP VIEW IF EXISTS public.profiles_safe;

-- View anonimizada de reviews (SECURITY INVOKER)
CREATE VIEW public.reviews_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  audiobook_id,
  rating,
  review_text,
  created_at,
  updated_at,
  CASE 
    WHEN auth.uid() = user_id THEN user_id
    WHEN has_role(auth.uid(), 'admin') THEN user_id
    ELSE NULL
  END as user_id
FROM public.reviews;

GRANT SELECT ON public.reviews_public TO authenticated, anon;

-- View segura de profiles (SECURITY INVOKER)
CREATE VIEW public.profiles_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  avatar_url,
  created_at,
  updated_at,
  status,
  CASE 
    WHEN auth.uid() = id THEN email
    WHEN has_role(auth.uid(), 'admin') THEN email
    ELSE NULL
  END as email
FROM public.profiles;

GRANT SELECT ON public.profiles_safe TO authenticated;