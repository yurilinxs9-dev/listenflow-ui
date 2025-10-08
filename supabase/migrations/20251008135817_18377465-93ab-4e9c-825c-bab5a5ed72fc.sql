-- Add view_count column to audiobooks table
ALTER TABLE public.audiobooks 
ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0;

-- Create index for faster sorting by view_count
CREATE INDEX IF NOT EXISTS idx_audiobooks_view_count ON public.audiobooks(view_count DESC);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_audiobook_views(audiobook_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.audiobooks
  SET view_count = view_count + 1
  WHERE id = audiobook_id;
END;
$$;