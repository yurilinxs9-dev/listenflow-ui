-- Increase file size limit for audiobooks bucket to 5GB
UPDATE storage.buckets
SET file_size_limit = 5368709120
WHERE id = 'audiobooks';