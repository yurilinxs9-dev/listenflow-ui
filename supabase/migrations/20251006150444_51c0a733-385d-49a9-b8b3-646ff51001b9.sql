-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Allow users to view their own roles (simpler policy)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow anyone authenticated to check if they are admin (needed for the useAdmin hook)
CREATE POLICY "Allow checking own admin status"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);