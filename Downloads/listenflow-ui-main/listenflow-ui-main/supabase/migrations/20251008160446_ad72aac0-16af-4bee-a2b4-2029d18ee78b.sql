-- Drop all duplicate/conflicting policies for audiobook-covers bucket
DROP POLICY IF EXISTS "Authenticated users can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view audiobook covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete audiobook covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update audiobook covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload audiobook covers" ON storage.objects;
DROP POLICY IF EXISTS "audiobook_covers_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "audiobook_covers_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "audiobook_covers_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "audiobook_covers_update_policy" ON storage.objects;

-- Create clean, consistent policies for audiobook-covers bucket
-- Public can view all covers
CREATE POLICY "audiobook_covers_public_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audiobook-covers');

-- Authenticated users can insert into their own folder
CREATE POLICY "audiobook_covers_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audiobook-covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update their own files
CREATE POLICY "audiobook_covers_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audiobook-covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own files
CREATE POLICY "audiobook_covers_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audiobook-covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);