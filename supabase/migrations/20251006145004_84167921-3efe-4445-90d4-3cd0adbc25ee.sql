-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
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
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update audiobooks RLS policies for admin management
DROP POLICY IF EXISTS "Users can create their own audiobooks" ON public.audiobooks;
DROP POLICY IF EXISTS "Users can delete their own audiobooks" ON public.audiobooks;
DROP POLICY IF EXISTS "Users can update their own audiobooks" ON public.audiobooks;

CREATE POLICY "Users can create their own audiobooks"
ON public.audiobooks
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

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