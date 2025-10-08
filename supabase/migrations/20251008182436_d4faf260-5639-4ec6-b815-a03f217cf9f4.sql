-- Create table for audiobook transcriptions/subtitles
CREATE TABLE IF NOT EXISTS public.audiobook_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  start_time DECIMAL NOT NULL,
  end_time DECIMAL NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transcriptions_audiobook_time 
ON public.audiobook_transcriptions(audiobook_id, start_time);

-- Enable RLS
ALTER TABLE public.audiobook_transcriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies - everyone can read transcriptions
CREATE POLICY "Transcriptions are viewable by everyone"
ON public.audiobook_transcriptions
FOR SELECT
USING (true);

-- Only admins can insert/update/delete transcriptions
CREATE POLICY "Only admins can manage transcriptions"
ON public.audiobook_transcriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_audiobook_transcriptions_updated_at
BEFORE UPDATE ON public.audiobook_transcriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();