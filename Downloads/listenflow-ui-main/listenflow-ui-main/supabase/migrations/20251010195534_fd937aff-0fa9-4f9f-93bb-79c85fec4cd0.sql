-- SEGURANÇA: Recriar view sem SECURITY DEFINER
DROP VIEW IF EXISTS public.reviews_anonymous;

CREATE VIEW public.reviews_anonymous 
WITH (security_invoker=true) AS
SELECT 
  id,
  audiobook_id,
  rating,
  review_text,
  created_at,
  updated_at,
  -- Anonimizar user_id usando hash
  encode(digest(user_id::text, 'sha256'), 'hex') as anonymous_user_id
FROM public.reviews;

-- Permitir acesso à view
GRANT SELECT ON public.reviews_anonymous TO authenticated;
GRANT SELECT ON public.reviews_anonymous TO anon;