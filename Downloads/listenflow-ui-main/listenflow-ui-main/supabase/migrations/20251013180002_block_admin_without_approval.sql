-- 🚨 CORREÇÃO CRÍTICA: Admins DEVEM estar aprovados
-- Data: 2025-10-13
-- Problema: Role 'admin' pode ser atribuída sem verificar status='approved'

-- 1. REVOGAR role 'admin' de todos usuários NÃO aprovados (CRÍTICO!)
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id IN (
    SELECT id FROM public.profiles
    WHERE status != 'approved'
  );

-- Logar esta ação crítica
INSERT INTO public.security_audit_logs (
  user_id,
  action,
  table_name,
  suspicious,
  details
)
SELECT 
  ur.user_id,
  'admin_role_revoked_not_approved',
  'user_roles',
  true,
  jsonb_build_object(
    'reason', 'user_status_not_approved',
    'revoked_at', now(),
    'severity', 'CRITICAL'
  )
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role = 'admin' AND p.status != 'approved';

-- 2. Criar função de validação que bloqueia admin sem aprovação
CREATE OR REPLACE FUNCTION public.validate_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_status TEXT;
BEGIN
  -- Se está tentando inserir/atualizar role 'admin'
  IF NEW.role = 'admin' THEN
    -- Buscar status do usuário
    SELECT status INTO user_status
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Bloquear se não estiver aprovado
    IF user_status IS NULL OR user_status != 'approved' THEN
      -- Registrar tentativa suspeita
      INSERT INTO public.security_audit_logs (
        user_id,
        action,
        table_name,
        suspicious,
        details
      ) VALUES (
        NEW.user_id,
        'blocked_admin_assignment_not_approved',
        'user_roles',
        true,
        jsonb_build_object(
          'attempted_role', 'admin',
          'user_status', user_status,
          'blocked_at', now(),
          'severity', 'CRITICAL'
        )
      );
      
      RAISE EXCEPTION 'SEGURANÇA: Apenas usuários aprovados podem receber role admin. Status atual: %', user_status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_admin_role() IS
'SEGURANÇA CRÍTICA: Valida que apenas usuários com status=approved podem receber role admin.
Bloqueia e registra tentativas suspeitas.
Vulnerabilidade corrigida em 2025-10-13.';

-- 3. Criar trigger BEFORE INSERT/UPDATE em user_roles
DROP TRIGGER IF EXISTS enforce_admin_approval ON public.user_roles;
CREATE TRIGGER enforce_admin_approval
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_role();

-- 4. Atualizar políticas RLS de user_roles para serem mais restritivas
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Dividir em políticas específicas por operação
CREATE POLICY "admins_can_view_all_roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_can_insert_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND (
    -- Para role 'admin': verificar se target user está aprovado
    NEW.role != 'admin'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = NEW.user_id
        AND status = 'approved'
    )
  )
);

CREATE POLICY "admins_can_update_roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND (
    -- Para role 'admin': verificar se target user está aprovado
    NEW.role != 'admin'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = NEW.user_id
        AND status = 'approved'
    )
  )
);

CREATE POLICY "admins_can_delete_roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Criar constraint de integridade (última linha de defesa)
-- Nota: Constraints não podem usar subqueries, então usamos trigger acima

-- 6. Atualizar função has_role para também verificar status aprovado
CREATE OR REPLACE FUNCTION public.has_role_approved(_user_id UUID, _role app_role)
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
      AND (_role != 'admin' OR p.status = 'approved')
  )
$$;

COMMENT ON FUNCTION public.has_role_approved(UUID, app_role) IS
'SEGURANÇA: Verifica role E se usuário está aprovado (para admin).
Admins DEVEM ter status=approved.
Vulnerabilidade corrigida em 2025-10-13.';

-- 7. Criar índice composto para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_admin_approved
ON public.user_roles(user_id, role)
WHERE role = 'admin';

-- 8. Comentário de segurança
COMMENT ON TABLE public.user_roles IS
'ATENÇÃO DE SEGURANÇA: 
- Apenas usuários com profiles.status=approved podem ter role=admin
- Trigger validate_admin_role() bloqueia atribuições inválidas
- RLS policies verificam aprovação antes de permitir INSERT/UPDATE
- Violações são registradas em security_audit_logs com severity=CRITICAL
Última atualização: 2025-10-13';

