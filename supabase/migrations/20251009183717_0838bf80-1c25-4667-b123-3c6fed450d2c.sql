-- =========================================
-- SECURITY HARDENING - CRITICAL UPDATES (FIXED)
-- =========================================

-- 1. CREATE UPLOAD LOGS TABLE
CREATE TABLE IF NOT EXISTS public.upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  target_key TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.upload_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_logs" ON public.upload_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "system_insert_logs" ON public.upload_logs
FOR INSERT WITH CHECK (true);

-- 2. UPDATE STORAGE POLICIES - MAKE AUDIOBOOKS PRIVATE
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload audiobooks" ON storage.objects;

-- audiobooks bucket: Only authenticated users can read their own files or global files
CREATE POLICY "authenticated_read_own_or_global_audiobooks" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audiobooks' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.audiobooks ab
      WHERE ab.audio_url LIKE '%' || name || '%'
      AND ab.is_global = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "admin_upload_audiobooks" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audiobooks'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admin_update_audiobooks" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audiobooks'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admin_delete_audiobooks" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audiobooks'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- audiobook-covers bucket: Keep public read, restrict write to admins
DROP POLICY IF EXISTS "Public covers read" ON storage.objects;
DROP POLICY IF EXISTS "Users upload covers" ON storage.objects;

CREATE POLICY "public_read_covers" ON storage.objects
FOR SELECT USING (bucket_id = 'audiobook-covers');

CREATE POLICY "admin_upload_covers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audiobook-covers'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admin_update_covers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audiobook-covers'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admin_delete_covers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audiobook-covers'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 3. STRENGTHEN AUDIOBOOKS TABLE RLS
DROP POLICY IF EXISTS "Users can view all audiobooks" ON public.audiobooks;
DROP POLICY IF EXISTS "Users can create their own audiobooks" ON public.audiobooks;
DROP POLICY IF EXISTS "Users and admins can update audiobooks" ON public.audiobooks;
DROP POLICY IF EXISTS "Users and admins can delete audiobooks" ON public.audiobooks;

CREATE POLICY "select_public_own_or_admin" ON public.audiobooks
FOR SELECT USING (
  is_global = true
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admin_insert_audiobooks" ON public.audiobooks
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id = auth.uid()
);

CREATE POLICY "admin_update_audiobooks_table" ON public.audiobooks
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admin_delete_audiobooks_table" ON public.audiobooks
FOR DELETE USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 4. STRENGTHEN PROFILES TABLE RLS - ONLY ADMINS CAN CHANGE STATUS
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Admins can update any profile including status
CREATE POLICY "admin_update_profiles" ON public.profiles
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 5. CREATE RATE LIMIT TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint ON public.rate_limit_tracking(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint ON public.rate_limit_tracking(ip_address, endpoint, window_start);

ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_manage_rate_limits" ON public.rate_limit_tracking
FOR ALL USING (true) WITH CHECK (true);

-- 6. CREATE FUNCTION TO CHECK RATE LIMITS
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id UUID,
  _ip_address TEXT,
  _endpoint TEXT,
  _max_requests INTEGER DEFAULT 10,
  _window_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request_count INTEGER;
  _window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  _window_start := now() - (_window_minutes || ' minutes')::INTERVAL;
  
  SELECT COALESCE(SUM(request_count), 0)
  INTO _request_count
  FROM public.rate_limit_tracking
  WHERE endpoint = _endpoint
    AND window_start > _window_start
    AND (
      (_user_id IS NOT NULL AND user_id = _user_id)
      OR (_ip_address IS NOT NULL AND ip_address = _ip_address)
    );
  
  IF _request_count >= _max_requests THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.rate_limit_tracking (user_id, ip_address, endpoint, request_count, window_start)
  VALUES (_user_id, _ip_address, _endpoint, 1, now())
  ON CONFLICT DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- 7. ADD INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_audiobooks_user_global ON public.audiobooks(user_id, is_global);
CREATE INDEX IF NOT EXISTS idx_audiobooks_global ON public.audiobooks(is_global) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_upload_logs_user_created ON public.upload_logs(user_id, created_at DESC);

-- 8. CREATE PENDING UPLOADS TABLE
CREATE TABLE IF NOT EXISTS public.pending_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  expected_size BIGINT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_uploads_user ON public.pending_uploads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_uploads_expires ON public.pending_uploads(expires_at) WHERE completed = false;

ALTER TABLE public.pending_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_pending" ON public.pending_uploads
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));