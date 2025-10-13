-- Create chapters table for audiobooks
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audiobook_id UUID NOT NULL,
  title TEXT NOT NULL,
  start_time NUMERIC NOT NULL DEFAULT 0,
  duration NUMERIC NOT NULL DEFAULT 0,
  chapter_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_audiobook FOREIGN KEY (audiobook_id) REFERENCES public.audiobooks(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Create policies - chapters are viewable by everyone
CREATE POLICY "Chapters are viewable by everyone" 
ON public.chapters 
FOR SELECT 
USING (true);

-- Users can create chapters for their own audiobooks
CREATE POLICY "Users can create chapters for their audiobooks" 
ON public.chapters 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.audiobooks 
    WHERE audiobooks.id = chapters.audiobook_id 
    AND audiobooks.user_id = auth.uid()
  )
);

-- Users can update chapters for their own audiobooks
CREATE POLICY "Users can update chapters for their audiobooks" 
ON public.chapters 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.audiobooks 
    WHERE audiobooks.id = chapters.audiobook_id 
    AND audiobooks.user_id = auth.uid()
  )
);

-- Users can delete chapters for their own audiobooks
CREATE POLICY "Users can delete chapters for their audiobooks" 
ON public.chapters 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.audiobooks 
    WHERE audiobooks.id = chapters.audiobook_id 
    AND audiobooks.user_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_chapters_audiobook_id ON public.chapters(audiobook_id);
CREATE INDEX idx_chapters_chapter_number ON public.chapters(audiobook_id, chapter_number);