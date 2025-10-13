-- PROTEÇÃO MÁXIMA DE SEGURANÇA - RendaCast (CORRIGIDO)
-- Torna os áudios completamente privados e acessíveis apenas via URLs pré-assinadas

-- 1. Tornar bucket 'audiobooks' PRIVADO
UPDATE storage.buckets 
SET public = false 
WHERE id = 'audiobooks';

-- 2. Adicionar RLS policies para storage.objects (audiobooks)
-- Política para permitir leitura apenas com URLs pré-assinadas (autenticado)
CREATE POLICY "Authenticated users can access audiobooks via presigned URLs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audiobooks' AND
  auth.uid() IS NOT NULL
);

-- Política para upload de áudios (apenas admins via service role)
CREATE POLICY "Admins can upload audiobooks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audiobooks' AND
  has_role(auth.uid(), 'admin')
);

-- Política para atualização de áudios (apenas admins)
CREATE POLICY "Admins can update audiobooks"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audiobooks' AND
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'audiobooks' AND
  has_role(auth.uid(), 'admin')
);

-- Política para deleção de áudios (apenas admins)
CREATE POLICY "Admins can delete audiobooks"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audiobooks' AND
  has_role(auth.uid(), 'admin')
);

-- 3. OPCIONAL: Proteger capas também (manter público, mas com controle de escrita)
-- Adicionar políticas para audiobook-covers
CREATE POLICY "Everyone can view covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audiobook-covers');

CREATE POLICY "Admins can upload covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audiobook-covers' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audiobook-covers' AND
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'audiobook-covers' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audiobook-covers' AND
  has_role(auth.uid(), 'admin')
);