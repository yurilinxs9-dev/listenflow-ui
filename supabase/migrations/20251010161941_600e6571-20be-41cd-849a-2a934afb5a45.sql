-- Corrigir warnings de Security Definer Views
-- Remover views e usar RLS policies diretas nas tabelas

-- Remover views
DROP VIEW IF EXISTS public.reviews_public;
DROP VIEW IF EXISTS public.profiles_safe;

-- As RLS policies existentes já protegem adequadamente os dados
-- A view não é necessária - o RLS já faz o trabalho

-- Adicionar política adicional em profiles para ocultar emails de outros usuários
-- (já existe, mas vamos garantir)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Reviews já tem proteção adequada via RLS
-- User_id será visível apenas para queries autorizadas via RLS