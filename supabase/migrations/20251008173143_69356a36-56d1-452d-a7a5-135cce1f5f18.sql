-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Update existing users to approved status (so they don't lose access)
UPDATE public.profiles SET status = 'approved' WHERE status IS NULL;

-- Update RLS policies to allow admins to update user status
CREATE POLICY "Admins can update user status"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));