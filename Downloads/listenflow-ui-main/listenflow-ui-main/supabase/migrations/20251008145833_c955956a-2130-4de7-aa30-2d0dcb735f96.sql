-- Políticas RLS para o bucket audiobook-covers

-- Permitir que usuários autenticados façam upload de capas
CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audiobook-covers');

-- Permitir que usuários autenticados atualizem suas capas
CREATE POLICY "Authenticated users can update covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audiobook-covers');

-- Permitir que todos vejam as capas (bucket público)
CREATE POLICY "Anyone can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audiobook-covers');