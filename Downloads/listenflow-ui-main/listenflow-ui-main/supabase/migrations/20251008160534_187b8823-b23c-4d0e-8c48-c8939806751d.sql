-- Drop only the duplicate/old policies, keep the newer ones
DROP POLICY IF EXISTS "Authenticated users can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view audiobook covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete audiobook covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update audiobook covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload audiobook covers" ON storage.objects;

-- Create missing policies (using DO NOT EXISTS pattern)
DO $$ 
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'audiobook_covers_auth_insert'
  ) THEN
    CREATE POLICY "audiobook_covers_auth_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'audiobook-covers' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'audiobook_covers_auth_update'
  ) THEN
    CREATE POLICY "audiobook_covers_auth_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'audiobook-covers' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'audiobook_covers_auth_delete'
  ) THEN
    CREATE POLICY "audiobook_covers_auth_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'audiobook-covers' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;