-- Remover políticas antigas específicas do audiobook-covers
DROP POLICY IF EXISTS "Users can upload to their own folder in covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;

-- Criar novas políticas com verificação de pasta do usuário
CREATE POLICY "audiobook_covers_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audiobook-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "audiobook_covers_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audiobook-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "audiobook_covers_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audiobook-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "audiobook_covers_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'audiobook-covers');