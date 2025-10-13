-- 🚨 CORREÇÃO CRÍTICA DE SEGURANÇA: RLS Policies devem verificar status='approved'
-- Data: 2025-10-13
-- Problema: Usuários pending/rejected conseguem ver audiobooks globais via RLS

-- 1. Criar função helper para verificar se usuário está aprovado
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

COMMENT ON FUNCTION public.is_user_approved(UUID) IS 
'SEGURANÇA: Verifica se usuário tem status=approved. 
Usado em RLS policies para garantir que apenas usuários aprovados acessem conteúdo.
Vulnerabilidade corrigida em 2025-10-13.';

-- 2. Recriar policy de SELECT em audiobooks com verificação de status
DROP POLICY IF EXISTS "Allow viewing global, owned, or admin audiobooks" ON public.audiobooks;
DROP POLICY IF EXISTS "Allow authenticated users to view audiobooks" ON public.audiobooks;
DROP POLICY IF EXISTS "select_public_own_or_admin" ON public.audiobooks;

CREATE POLICY "approved_users_can_view_audiobooks"
ON public.audiobooks
FOR SELECT
USING (
  -- CRÍTICO: Verificar se usuário está aprovado PRIMEIRO
  (
    is_user_approved(auth.uid())
    AND (
      is_global = true  -- Audiobooks globais
      OR user_id = auth.uid()  -- Ou é o dono
    )
  )
  -- OU é admin (admins não precisam estar aprovados)
  OR has_role(auth.uid(), 'admin'::app_role)
);

COMMENT ON POLICY "approved_users_can_view_audiobooks" ON public.audiobooks IS
'SEGURANÇA: Apenas usuários com status=approved podem ver audiobooks.
Exceção: Admins sempre têm acesso.
Corrigido em 2025-10-13.';

-- 3. Atualizar policies de outras tabelas sensíveis

-- FAVORITES: Apenas usuários aprovados
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

CREATE POLICY "approved_users_can_view_favorites"
ON public.favorites
FOR SELECT
USING (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "approved_users_can_add_favorites"
ON public.favorites
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "approved_users_can_remove_favorites"
ON public.favorites
FOR DELETE
USING (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

-- USER_LISTS: Apenas usuários aprovados
DROP POLICY IF EXISTS "Users can view their own lists" ON public.user_lists;
DROP POLICY IF EXISTS "Users can create their own lists" ON public.user_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON public.user_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.user_lists;

CREATE POLICY "approved_users_can_view_lists"
ON public.user_lists
FOR SELECT
USING (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "approved_users_can_create_lists"
ON public.user_lists
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "approved_users_can_update_lists"
ON public.user_lists
FOR UPDATE
USING (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "approved_users_can_delete_lists"
ON public.user_lists
FOR DELETE
USING (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

-- LIST_ITEMS: Apenas usuários aprovados
DROP POLICY IF EXISTS "Users can view items in their lists" ON public.list_items;
DROP POLICY IF EXISTS "Users can add items to their lists" ON public.list_items;
DROP POLICY IF EXISTS "Users can remove items from their lists" ON public.list_items;

CREATE POLICY "approved_users_can_view_list_items"
ON public.list_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_lists
    WHERE user_lists.id = list_items.list_id
      AND user_lists.user_id = auth.uid()
  )
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "approved_users_can_add_list_items"
ON public.list_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_lists
    WHERE user_lists.id = list_items.list_id
      AND user_lists.user_id = auth.uid()
  )
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "approved_users_can_remove_list_items"
ON public.list_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_lists
    WHERE user_lists.id = list_items.list_id
      AND user_lists.user_id = auth.uid()
  )
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

-- AUDIOBOOK_PROGRESS: Apenas usuários aprovados
DROP POLICY IF EXISTS "Users can view their own progress" ON public.audiobook_progress;
DROP POLICY IF EXISTS "Users can create their own progress" ON public.audiobook_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.audiobook_progress;

CREATE POLICY "approved_users_can_view_progress"
ON public.audiobook_progress
FOR SELECT
USING (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "approved_users_can_create_progress"
ON public.audiobook_progress
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "approved_users_can_update_progress"
ON public.audiobook_progress
FOR UPDATE
USING (
  user_id = auth.uid()
  AND (is_user_approved(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

-- 4. Log de auditoria para acesso negado
CREATE OR REPLACE FUNCTION public.log_denied_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Logar quando usuário não aprovado tenta acessar
  IF auth.uid() IS NOT NULL AND NOT is_user_approved(auth.uid()) THEN
    INSERT INTO public.security_audit_logs (
      user_id,
      action,
      table_name,
      suspicious,
      details
    ) VALUES (
      auth.uid(),
      'rls_access_denied_not_approved',
      TG_TABLE_NAME,
      true,
      jsonb_build_object(
        'operation', TG_OP,
        'table', TG_TABLE_NAME,
        'timestamp', now()
      )
    );
  END IF;
  RETURN NULL;
END;
$$;

-- 5. Trigger para logar tentativas de acesso negado em audiobooks
DROP TRIGGER IF EXISTS log_denied_audiobook_access ON public.audiobooks;
CREATE TRIGGER log_denied_audiobook_access
  BEFORE SELECT ON public.audiobooks
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.log_denied_access();

-- 6. Índice para performance na verificação de status
CREATE INDEX IF NOT EXISTS idx_profiles_status_approved 
ON public.profiles(status) 
WHERE status = 'approved';

-- 7. Comentário de segurança
COMMENT ON FUNCTION public.is_user_approved(UUID) IS 
'SEGURANÇA CRÍTICA: Esta função DEVE ser usada em todas RLS policies 
que controlam acesso a conteúdo. Apenas usuários com status=approved 
devem ter acesso (exceto admins). Vulnerabilidade corrigida em 2025-10-13.';

