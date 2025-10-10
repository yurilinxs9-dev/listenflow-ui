-- SEGURANÇA: Adicionar políticas RLS para rate_limit_tracking
-- Esta tabela precisa permitir que o sistema grave logs de rate limiting
CREATE POLICY "System can manage rate limits"
ON public.rate_limit_tracking
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- PRIVACIDADE: Criar view sanitizada de reviews sem expor user_ids
CREATE OR REPLACE VIEW public.reviews_anonymous AS
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

-- Permitir acesso público à view anonimizada
GRANT SELECT ON public.reviews_anonymous TO authenticated;
GRANT SELECT ON public.reviews_anonymous TO anon;