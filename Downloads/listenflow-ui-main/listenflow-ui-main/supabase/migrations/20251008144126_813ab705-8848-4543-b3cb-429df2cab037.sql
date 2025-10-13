-- Configurar CORS para bucket audiobooks
UPDATE storage.buckets
SET public = true
WHERE id = 'audiobooks';

-- Atualizar file_size_limit para 500MB
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id IN ('audiobooks', 'audiobook-covers');

-- Permitir tipos de arquivo de áudio
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/mpeg',
  'audio/mp3', 
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/aac'
]
WHERE id = 'audiobooks';

-- Permitir tipos de imagem para capas
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif'
]
WHERE id = 'audiobook-covers';