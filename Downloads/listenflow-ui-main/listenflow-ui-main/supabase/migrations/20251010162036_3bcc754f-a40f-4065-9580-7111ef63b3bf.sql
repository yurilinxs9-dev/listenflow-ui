-- SEGURANÇA MÁXIMA DO BANCO DE DADOS - RendaCast (CORRIGIDO)
-- Proteção completa contra vazamento de dados e ataques

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_logs;

-- 1. CRIAR TABELA DE AUDIT LOGS para monitorar acessos suspeitos
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  suspicious BOOLEAN DEFAULT false,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de audit
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true);

-- 2. CRIAR VIEW ANONIMIZADA PARA REVIEWS (ocultar user_id de não-donos)
CREATE OR REPLACE VIEW public.reviews_public AS
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

-- 3. CRIAR VIEW SEGURA DE PROFILES (ocultar emails)
CREATE OR REPLACE VIEW public.profiles_safe AS
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

-- 4. FUNÇÃO DE SEGURANÇA: Detectar scraping/enumeração
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  _user_id UUID,
  _action TEXT,
  _table_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request_count INTEGER;
  _is_suspicious BOOLEAN := false;
BEGIN
  SELECT COUNT(*)
  INTO _request_count
  FROM public.security_audit_logs
  WHERE user_id = _user_id
    AND table_name = _table_name
    AND created_at > (now() - INTERVAL '60 seconds');
  
  IF _request_count > 50 THEN
    _is_suspicious := true;
    INSERT INTO public.security_audit_logs 
      (user_id, action, table_name, suspicious, details)
    VALUES 
      (_user_id, _action, _table_name, true, 
       jsonb_build_object('request_count', _request_count, 'reason', 'rate_limit_exceeded'));
  END IF;
  
  RETURN _is_suspicious;
END;
$$;

-- 5. FUNÇÃO: Limpar logs antigos automaticamente (>90 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.security_audit_logs
  WHERE created_at < (now() - INTERVAL '90 days')
    AND suspicious = false;
END;
$$;

-- 6. ADICIONAR ÍNDICES para performance e prevenir DOS
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON public.security_audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_suspicious 
ON public.security_audit_logs(suspicious, created_at DESC) 
WHERE suspicious = true;

-- 7. ADICIONAR CONSTRAINTS para prevenir overflow attacks
DO $$ 
BEGIN
  ALTER TABLE public.reviews 
  ADD CONSTRAINT review_text_length_check 
  CHECK (LENGTH(review_text) <= 5000);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.profiles 
  ADD CONSTRAINT display_name_length_check 
  CHECK (LENGTH(display_name) <= 100);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.user_lists 
  ADD CONSTRAINT list_name_length_check 
  CHECK (LENGTH(name) <= 200);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.user_lists 
  ADD CONSTRAINT list_description_length_check 
  CHECK (LENGTH(description) <= 1000);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.security_audit_logs IS 'Auditoria: detecta e monitora atividades suspeitas (scraping, ataques)';
COMMENT ON FUNCTION public.detect_suspicious_activity IS 'Detecta padrões de scraping e ataques de enumeração (>50 req/min)';
COMMENT ON VIEW public.reviews_public IS 'View segura: oculta user_id de reviews de outros usuários';
COMMENT ON VIEW public.profiles_safe IS 'View segura: oculta emails de outros usuários';