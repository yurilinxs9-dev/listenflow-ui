-- Corrigir política RLS para permitir acesso público a audiobooks globais
-- Problema: usuários não autenticados não conseguem ver audiobooks globais
-- Solução: permitir acesso público a audiobooks com is_global = true

DROP POLICY IF EXISTS "approved_users_can_view_audiobooks" ON public.audiobooks;

CREATE POLICY "public_and_approved_users_view_audiobooks"
ON public.audiobooks
FOR SELECT
USING (
  -- Permitir audiobooks globais para TODOS (incluindo não autenticados)
  is_global = true
  -- OU usuários aprovados podem ver seus próprios audiobooks
  OR (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
    AND is_user_approved(auth.uid())
  )
  -- OU admins podem ver tudo
  OR has_role(auth.uid(), 'admin'::app_role)
);

COMMENT ON POLICY "public_and_approved_users_view_audiobooks" ON public.audiobooks IS
'Permite acesso público a audiobooks globais. Usuários aprovados podem ver seus próprios audiobooks. Admins têm acesso total.';