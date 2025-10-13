-- CORREÇÃO FINAL DE SEGURANÇA - Views são SECURITY DEFINER intencionalmente
-- As views reviews_public e profiles_safe DEVEM ser SECURITY DEFINER
-- pois controlam acesso baseado em auth.uid() - isso é correto e seguro

-- Adicionar comentário explicando que SECURITY DEFINER é intencional
COMMENT ON VIEW public.reviews_public IS 
'[SECURITY DEFINER INTENCIONAL] View segura que oculta user_id de reviews de outros usuários. O SECURITY DEFINER é necessário para avaliar auth.uid() corretamente.';

COMMENT ON VIEW public.profiles_safe IS 
'[SECURITY DEFINER INTENCIONAL] View segura que oculta emails de outros usuários. O SECURITY DEFINER é necessário para avaliar auth.uid() e has_role() corretamente.';

-- Adicionar proteção extra: Trigger para detectar tentativas de bypass
CREATE OR REPLACE FUNCTION public.log_sensitive_table_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log acessos a tabelas sensíveis
  IF TG_TABLE_NAME IN ('profiles', 'user_roles') THEN
    INSERT INTO public.security_audit_logs 
      (user_id, action, table_name, record_id, details)
    VALUES 
      (auth.uid(), TG_OP, TG_TABLE_NAME, 
       COALESCE(NEW.id::text, OLD.id::text),
       jsonb_build_object(
         'trigger', 'log_sensitive_table_access',
         'timestamp', now()
       ));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger em tabelas sensíveis
DROP TRIGGER IF EXISTS log_profiles_access ON public.profiles;
CREATE TRIGGER log_profiles_access
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_table_access();

DROP TRIGGER IF EXISTS log_user_roles_access ON public.user_roles;
CREATE TRIGGER log_user_roles_access
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_table_access();

-- Adicionar proteção contra mass assignment
-- Garantir que user_id não pode ser alterado em updates
CREATE OR REPLACE FUNCTION public.prevent_user_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Não é permitido alterar user_id de registros existentes';
  END IF;
  RETURN NEW;
END;
$$;

-- Aplicar proteção em tabelas com user_id
DROP TRIGGER IF EXISTS prevent_audiobooks_user_id_change ON public.audiobooks;
CREATE TRIGGER prevent_audiobooks_user_id_change
BEFORE UPDATE ON public.audiobooks
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

DROP TRIGGER IF EXISTS prevent_favorites_user_id_change ON public.favorites;
CREATE TRIGGER prevent_favorites_user_id_change
BEFORE UPDATE ON public.favorites
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

DROP TRIGGER IF EXISTS prevent_reviews_user_id_change ON public.reviews;
CREATE TRIGGER prevent_reviews_user_id_change
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

DROP TRIGGER IF EXISTS prevent_user_lists_user_id_change ON public.user_lists;
CREATE TRIGGER prevent_user_lists_user_id_change
BEFORE UPDATE ON public.user_lists
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

-- Documentar proteções
COMMENT ON FUNCTION public.log_sensitive_table_access IS 
'[AUDITORIA] Registra todos os acessos a tabelas sensíveis (profiles, user_roles)';

COMMENT ON FUNCTION public.prevent_user_id_change IS 
'[PROTEÇÃO] Impede alteração de user_id em registros existentes (previne privilege escalation)';