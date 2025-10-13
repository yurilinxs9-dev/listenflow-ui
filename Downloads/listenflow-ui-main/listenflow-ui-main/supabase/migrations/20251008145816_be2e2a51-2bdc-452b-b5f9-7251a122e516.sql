-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;

-- Criar políticas RLS corretas para o bucket audiobook-covers
CREATE POLICY "Users can upload audiobook covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audiobook-covers');

CREATE POLICY "Users can update audiobook covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audiobook-covers');

CREATE POLICY "Users can delete audiobook covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audiobook-covers');

CREATE POLICY "Public can view audiobook covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'audiobook-covers');