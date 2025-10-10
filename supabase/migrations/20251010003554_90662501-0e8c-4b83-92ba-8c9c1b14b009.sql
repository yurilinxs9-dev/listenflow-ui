-- Marcar os top 10 audiobooks mais visualizados como globais
-- Isso permite que sejam exibidos publicamente
UPDATE public.audiobooks
SET is_global = true
WHERE id IN (
  SELECT id 
  FROM public.audiobooks 
  WHERE audio_url IS NOT NULL
  ORDER BY view_count DESC 
  LIMIT 10
);

-- Garantir que a política de segurança está correta
-- Apenas admins podem modificar is_global
-- Esta política já existe, mas vamos garantir que está ativa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audiobooks' 
    AND policyname = 'admin_update_audiobooks_table'
  ) THEN
    CREATE POLICY "admin_update_audiobooks_table"
    ON public.audiobooks
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;