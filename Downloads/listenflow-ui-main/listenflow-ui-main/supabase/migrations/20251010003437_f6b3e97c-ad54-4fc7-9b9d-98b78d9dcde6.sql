-- Ajustar política de SELECT para permitir visualização pública de audiobooks globais
DROP POLICY IF EXISTS "Allow authenticated users to view audiobooks" ON public.audiobooks;

-- Restaurar política que permite visualização pública de audiobooks globais
CREATE POLICY "Allow viewing global, owned, or admin audiobooks"
ON public.audiobooks
FOR SELECT
USING (
  -- Permitir se for global
  is_global = true
  -- OU se for o dono do audiobook
  OR user_id = auth.uid()
  -- OU se for admin
  OR has_role(auth.uid(), 'admin'::app_role)
);