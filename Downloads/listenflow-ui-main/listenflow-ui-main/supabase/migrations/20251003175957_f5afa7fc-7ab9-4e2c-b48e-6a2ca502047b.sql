-- Create storage bucket for audiobooks
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audiobooks', 'audiobooks', true);

-- Create storage bucket for audiobook covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audiobook-covers', 'audiobook-covers', true);

-- Create audiobooks table
CREATE TABLE public.audiobooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  narrator text,
  duration_seconds numeric NOT NULL DEFAULT 0,
  description text,
  genre text,
  cover_url text,
  audio_url text NOT NULL,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audiobooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audiobooks table
CREATE POLICY "Users can view all audiobooks"
ON public.audiobooks
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own audiobooks"
ON public.audiobooks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audiobooks"
ON public.audiobooks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audiobooks"
ON public.audiobooks
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for audiobooks bucket
CREATE POLICY "Anyone can view audiobooks"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audiobooks');

CREATE POLICY "Authenticated users can upload audiobooks"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audiobooks' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own audiobooks"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'audiobooks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audiobooks"
ON storage.objects
FOR DELETE
USING (bucket_id = 'audiobooks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for covers bucket
CREATE POLICY "Anyone can view covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audiobook-covers');

CREATE POLICY "Authenticated users can upload covers"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audiobook-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own covers"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'audiobook-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own covers"
ON storage.objects
FOR DELETE
USING (bucket_id = 'audiobook-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_audiobooks_updated_at
BEFORE UPDATE ON public.audiobooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();