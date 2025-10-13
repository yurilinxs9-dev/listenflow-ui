-- Fix: Remove the overly permissive INSERT policy for security_audit_logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_logs;

-- Create a secure logging function with proper input validation
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id TEXT DEFAULT NULL,
  p_suspicious BOOLEAN DEFAULT FALSE,
  p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Validate required inputs
  IF p_action IS NULL OR p_table_name IS NULL THEN
    RAISE EXCEPTION 'Action and table_name are required';
  END IF;
  
  -- Insert with proper user attribution from auth context
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    suspicious,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_suspicious,
    p_details
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

-- Fix: Add explicit deny policies for upload_logs to prevent client writes
CREATE POLICY "no_direct_insert" ON public.upload_logs
FOR INSERT
WITH CHECK (false);

CREATE POLICY "no_direct_update" ON public.upload_logs
FOR UPDATE
USING (false);

CREATE POLICY "no_direct_delete" ON public.upload_logs
FOR DELETE
USING (false);