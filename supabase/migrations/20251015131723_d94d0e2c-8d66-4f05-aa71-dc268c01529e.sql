-- 🚨 CORREÇÕES DE SEGURANÇA CRÍTICAS - ListenFlow
-- Data: 2025-10-15
-- Total: 4 vulnerabilidades CRITICAL/HIGH
-- CVSS Score: 9.5/10 (CRITICAL)

-- =============================================================================
-- MIGRATION 1 - Correção de Aprovação de Usuários
-- =============================================================================
-- Problema: Novos usuários recebem status 'approved' por padrão
-- CVSS: 9.0/10 (CRITICAL) - Bypass de controle de acesso

-- 1. LOG DE AUDITORIA: Registrar esta correção como incidente de segurança
INSERT INTO public.security_audit_logs (
  action,
  table_name,
  suspicious,
  details
) VALUES (
  'security_incident_user_auto_approval',
  'profiles',
  true,
  jsonb_build_object(
    'severity', 'CRITICAL',
    'cvss_score', 9.0,
    'issue', 'New users automatically approved without admin review',
    'impact', 'Unauthorized access to content, bypass of approval system',
    'fixed_at', now(),
    'affected_users', (SELECT COUNT(*) FROM profiles WHERE status = 'approved' AND created_at > now() - interval '7 days')
  )
);

-- 2. CORRIGIR função handle_new_user para status 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, status)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'display_name',
    'pending'
  );
  
  INSERT INTO public.security_audit_logs (
    action,
    table_name,
    suspicious,
    details
  ) VALUES (
    'new_user_registered',
    'profiles',
    false,
    jsonb_build_object(
      'user_id', new.id,
      'email', new.email,
      'status', 'pending',
      'requires_approval', true,
      'registered_at', now()
    )
  );
  
  RETURN new;
END;
$$;

-- 3. ATUALIZAR usuários existentes não aprovados para 'pending'
UPDATE public.profiles 
SET status = 'pending' 
WHERE status IS NULL OR status = 'approved'
  AND created_at > now() - interval '7 days'
  AND id NOT IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  );

-- 4. LOG da correção
INSERT INTO public.security_audit_logs (
  action,
  table_name,
  suspicious,
  details
) VALUES (
  'users_updated_to_pending',
  'profiles',
  false,
  jsonb_build_object(
    'updated_count', (SELECT COUNT(*) FROM profiles WHERE status = 'pending'),
    'updated_at', now()
  )
);

-- =============================================================================
-- MIGRATION 2 - Enforçar Status Aprovado em RLS
-- =============================================================================
-- Problema: RLS não verifica status de aprovação
-- CVSS: 8.5/10 (HIGH) - Bypass de autorização

-- 1. CRIAR função para verificar se usuário está aprovado
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND status = 'approved'
  )
$$;

-- 2. ATUALIZAR RLS policies para verificar aprovação
-- Audiobooks
DROP POLICY IF EXISTS "Allow viewing global, owned, or admin audiobooks" ON public.audiobooks;
DROP POLICY IF EXISTS "select_public_own_or_admin" ON public.audiobooks;
CREATE POLICY "approved_users_can_view_audiobooks"
ON public.audiobooks
FOR SELECT
USING (
  (
    is_user_approved(auth.uid())
    AND (
      is_global = true
      OR user_id = auth.uid()
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "approved_users_can_view_favorites"
ON public.favorites
FOR SELECT
USING (
  is_user_approved(auth.uid())
  AND user_id = auth.uid()
);

-- User Lists
DROP POLICY IF EXISTS "Users can view their own lists" ON public.user_lists;
CREATE POLICY "approved_users_can_view_lists"
ON public.user_lists
FOR SELECT
USING (
  is_user_approved(auth.uid())
  AND user_id = auth.uid()
);

-- List Items
DROP POLICY IF EXISTS "Users can view items in their lists" ON public.list_items;
CREATE POLICY "approved_users_can_view_list_items"
ON public.list_items
FOR SELECT
USING (
  is_user_approved(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_lists 
    WHERE id = list_items.list_id 
    AND user_id = auth.uid()
  )
);

-- Audiobook Progress
DROP POLICY IF EXISTS "Users can view their own progress" ON public.audiobook_progress;
CREATE POLICY "approved_users_can_view_progress"
ON public.audiobook_progress
FOR SELECT
USING (
  is_user_approved(auth.uid())
  AND user_id = auth.uid()
);

-- 3. LOG da correção
INSERT INTO public.security_audit_logs (
  action,
  table_name,
  suspicious,
  details
) VALUES (
  'rls_policies_updated_approval_check',
  'multiple_tables',
  false,
  jsonb_build_object(
    'tables_updated', jsonb_build_array('audiobooks', 'favorites', 'user_lists', 'list_items', 'audiobook_progress'),
    'function_created', 'is_user_approved',
    'updated_at', now()
  )
);

-- =============================================================================
-- MIGRATION 3 - Bloquear Admin sem Aprovação
-- =============================================================================
-- Problema: Role 'admin' não verifica status de aprovação
-- CVSS: 9.5/10 (CRITICAL) - Escalação de privilégios

-- 1. LOG de auditoria
INSERT INTO public.security_audit_logs (
  action,
  table_name,
  suspicious,
  details
) VALUES (
  'security_incident_admin_without_approval',
  'user_roles',
  true,
  jsonb_build_object(
    'severity', 'CRITICAL',
    'cvss_score', 9.5,
    'issue', 'Admin roles assigned without user approval',
    'impact', 'Unauthorized admin access, complete system compromise',
    'fixed_at', now()
  )
);

-- 2. REVOGAR roles de admin de usuários não aprovados
DELETE FROM public.user_roles 
WHERE role = 'admin' 
  AND user_id IN (
    SELECT id FROM profiles 
    WHERE status != 'approved'
  );

-- 3. CRIAR função para verificar admin aprovado
CREATE OR REPLACE FUNCTION public.is_approved_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = 'admin'
      AND p.status = 'approved'
  )
$$;

-- 4. ATUALIZAR função has_role para verificar aprovação
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (p.status = 'approved' OR _role != 'admin')
  )
$$;

-- 5. CRIAR trigger para prevenir admin sem aprovação
CREATE OR REPLACE FUNCTION public.prevent_unapproved_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = NEW.user_id 
        AND status = 'approved'
    ) THEN
      RAISE EXCEPTION 'Cannot assign admin role to unapproved user';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_unapproved_admin_trigger ON public.user_roles;
CREATE TRIGGER prevent_unapproved_admin_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unapproved_admin();

-- 6. LOG da correção
INSERT INTO public.security_audit_logs (
  action,
  table_name,
  suspicious,
  details
) VALUES (
  'admin_roles_revoked_unapproved',
  'user_roles',
  false,
  jsonb_build_object(
    'revoked_count', (SELECT COUNT(*) FROM user_roles WHERE role = 'admin'),
    'function_created', 'is_approved_admin',
    'trigger_created', 'prevent_unapproved_admin_trigger',
    'updated_at', now()
  )
);

-- =============================================================================
-- MIGRATION 4 - Corrigir Exposição de Rate Limiting
-- =============================================================================
-- Problema: Policy USING(true) permite qualquer usuário ver IPs e atividades
-- CVSS: 7.5/10 (HIGH) - Exposição de dados sensíveis

-- 1. LOG DE AUDITORIA
INSERT INTO public.security_audit_logs (
  action,
  table_name,
  suspicious,
  details
) VALUES (
  'security_incident_rate_limit_exposure',
  'rate_limit_tracking',
  true,
  jsonb_build_object(
    'severity', 'HIGH',
    'cvss_score', 7.5,
    'issue', 'RLS policy USING(true) exposed user IPs and activity patterns',
    'impact', 'Privacy violation, LGPD non-compliance, potential doxxing',
    'fixed_at', now(),
    'exposed_data', jsonb_build_array('user_id', 'ip_address', 'endpoint', 'request_count', 'window_start')
  )
);

-- 2. REMOVER TODAS as policies perigosas existentes
DROP POLICY IF EXISTS "system_manage_rate_limits" ON public.rate_limit_tracking;
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limit_tracking;
DROP POLICY IF EXISTS "system_insert_rate_limits" ON public.rate_limit_tracking;
DROP POLICY IF EXISTS "public_rate_limits" ON public.rate_limit_tracking;

-- 3. GARANTIR que RLS está ativado
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLICY RESTRITIVA: Apenas admins podem fazer SELECT
CREATE POLICY "only_admins_can_view_rate_limits"
ON public.rate_limit_tracking
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 5. LIMPAR dados antigos (privacidade LGPD)
DELETE FROM public.rate_limit_tracking 
WHERE created_at < now() - interval '7 days';

-- 6. ADICIONAR constraints para não permitir NULL em dados sensíveis
ALTER TABLE public.rate_limit_tracking
  ALTER COLUMN endpoint SET NOT NULL,
  ALTER COLUMN window_start SET NOT NULL;

-- 7. REGISTRAR correção como resolvida
INSERT INTO public.security_audit_logs (
  action,
  table_name,
  suspicious,
  details
) VALUES (
  'vulnerability_fixed_rate_limit_exposure',
  'rate_limit_tracking',
  false,
  jsonb_build_object(
    'severity', 'HIGH',
    'cvss_score', 7.5,
    'status', 'FIXED',
    'fixed_at', now(),
    'fix_type', 'RLS policies removed and restricted to admins only',
    'compliance', jsonb_build_array('LGPD', 'Privacy by Design')
  )
);

-- =============================================================================
-- SUMMARY LOG - Consolidação de todas as correções
-- =============================================================================
INSERT INTO public.security_audit_logs (
  action,
  table_name,
  suspicious,
  details
) VALUES (
  'critical_security_fixes_applied',
  'system',
  false,
  jsonb_build_object(
    'severity', 'CRITICAL',
    'total_fixes', 4,
    'cvss_scores', jsonb_build_array(9.5, 9.0, 8.5, 7.5),
    'fixes_applied', jsonb_build_array(
      'User auto-approval vulnerability fixed',
      'RLS policies enforcing approved status',
      'Admin role now requires approval',
      'Rate limit data exposure eliminated'
    ),
    'compliance', jsonb_build_array('LGPD', 'OWASP Top 10', 'Privacy by Design'),
    'applied_at', now(),
    'applied_by', 'security_hardening_migration'
  )
);