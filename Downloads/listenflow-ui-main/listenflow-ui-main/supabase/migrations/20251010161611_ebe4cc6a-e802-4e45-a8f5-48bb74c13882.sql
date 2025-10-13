-- PROTEÇÃO MÁXIMA DE SEGURANÇA - RendaCast (LIMPEZA E RECRIAÇÃO)

-- Primeiro, remover policies existentes se houver
DROP POLICY IF EXISTS "Authenticated users can access audiobooks via presigned URLs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload audiobooks" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update audiobooks" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete audiobooks" ON storage.objects;
DROP POLICY IF EXISTS "Everyone can view covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete covers" ON storage.objects;

-- 1. Tornar bucket 'audiobooks' PRIVADO
UPDATE storage.buckets 
SET public = false 
WHERE id = 'audiobooks';

-- 2. Criar políticas RLS para storage.objects (audiobooks)

-- Leitura de áudios (apenas autenticados via URLs pré-assinadas)
CREATE POLICY "Authenticated users can access audiobooks via presigned URLs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audiobooks' AND
  auth.uid() IS NOT NULL
);

-- Upload de áudios (apenas admins)
CREATE POLICY "Admins can upload audiobooks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audiobooks' AND
  has_role(auth.uid(), 'admin')
);

-- Atualização de áudios (apenas admins)
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

-- Deleção de áudios (apenas admins)
CREATE POLICY "Admins can delete audiobooks"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audiobooks' AND
  has_role(auth.uid(), 'admin')
);

-- 3. Políticas para capas (audiobook-covers)

-- Visualização de capas (público)
CREATE POLICY "Everyone can view covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audiobook-covers');

-- Upload de capas (apenas admins)
CREATE POLICY "Admins can upload covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audiobook-covers' AND
  has_role(auth.uid(), 'admin')
);

-- Atualização de capas (apenas admins)
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

-- Deleção de capas (apenas admins)
CREATE POLICY "Admins can delete covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audiobook-covers' AND
  has_role(auth.uid(), 'admin')
);