-- Drop and recreate the function with correct type handling
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::TEXT = _role
  )
$$;

-- Update audiobooks RLS policies for admin management
DROP POLICY IF EXISTS "Users and admins can delete audiobooks" ON public.audiobooks;
DROP POLICY IF EXISTS "Users and admins can update audiobooks" ON public.audiobooks;

CREATE POLICY "Users and admins can delete audiobooks"
ON public.audiobooks
FOR DELETE
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users and admins can update audiobooks"
ON public.audiobooks
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);