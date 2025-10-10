-- SEGURANÇA MÁXIMA DO BANCO DE DADOS - RendaCast (LIMPEZA PRIMEIRO)

-- Limpar policies e objetos existentes
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_logs;
DROP VIEW IF EXISTS public.reviews_public;
DROP VIEW IF EXISTS public.profiles_safe;
DROP FUNCTION IF EXISTS public.detect_suspicious_activity(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.prevent_full_table_scan();
DROP FUNCTION IF EXISTS public.check_review_access();
DROP FUNCTION IF EXISTS public.cleanup_old_audit_logs();

-- 1. CRIAR TABELA DE AUDIT LOGS (se não existir)
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

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies para audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true);

-- 2. VIEW ANONIMIZADA PARA REVIEWS
CREATE VIEW public.reviews_public AS
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

-- 3. VIEW SEGURA DE PROFILES (oculta emails)
CREATE VIEW public.profiles_safe AS
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

-- 4. FUNÇÃO: Detectar atividade suspeita
CREATE FUNCTION public.detect_suspicious_activity(
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

-- 5. FUNÇÃO: Limpar logs antigos (>90 dias)
CREATE FUNCTION public.cleanup_old_audit_logs()
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

-- 6. ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON public.security_audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_suspicious 
ON public.security_audit_logs(suspicious, created_at DESC) 
WHERE suspicious = true;

-- 7. CONSTRAINTS de segurança (limitar tamanhos)
DO $$
BEGIN
  -- Review text
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'review_text_length_check'
  ) THEN
    ALTER TABLE public.reviews 
    ADD CONSTRAINT review_text_length_check 
    CHECK (LENGTH(review_text) <= 5000);
  END IF;

  -- Display name
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'display_name_length_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT display_name_length_check 
    CHECK (LENGTH(display_name) <= 100);
  END IF;

  -- List name
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'list_name_length_check'
  ) THEN
    ALTER TABLE public.user_lists 
    ADD CONSTRAINT list_name_length_check 
    CHECK (LENGTH(name) <= 200);
  END IF;

  -- List description
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'list_description_length_check'
  ) THEN
    ALTER TABLE public.user_lists 
    ADD CONSTRAINT list_description_length_check 
    CHECK (LENGTH(description) <= 1000);
  END IF;
END $$;

-- 8. COMENTÁRIOS
COMMENT ON TABLE public.security_audit_logs IS 'Auditoria para detectar atividades suspeitas e vazamentos';
COMMENT ON FUNCTION public.detect_suspicious_activity IS 'Detecta scraping, enumeração e ataques';
COMMENT ON VIEW public.reviews_public IS 'Reviews anonimizadas - oculta user_id de terceiros';
COMMENT ON VIEW public.profiles_safe IS 'Profiles seguros - oculta emails de terceiros';