-- Ajustar política de SELECT para audiobooks
-- Permitir que usuários autenticados vejam audiobooks (não apenas admins)
DROP POLICY IF EXISTS "Allow public/owner/admin to view audiobooks" ON public.audiobooks;

CREATE POLICY "Allow authenticated users to view audiobooks"
ON public.audiobooks
FOR SELECT
USING (
  -- Permitir se for público
  NOT require_login
  -- OU se o usuário estiver autenticado
  OR auth.uid() IS NOT NULL
);