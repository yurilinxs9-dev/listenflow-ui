-- Add featured column to audiobooks table
ALTER TABLE public.audiobooks 
ADD COLUMN is_featured BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_audiobooks_featured ON public.audiobooks(is_featured) WHERE is_featured = true;