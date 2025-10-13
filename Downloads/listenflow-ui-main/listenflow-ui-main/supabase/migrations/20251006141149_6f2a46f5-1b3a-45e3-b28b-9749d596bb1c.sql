-- Adicionar campos de controle de acesso aos audiobooks
ALTER TABLE audiobooks
ADD COLUMN is_global boolean DEFAULT false,
ADD COLUMN require_login boolean DEFAULT true,
ADD COLUMN min_subscription_level text DEFAULT 'free';

-- Comentários explicativos
COMMENT ON COLUMN audiobooks.is_global IS 'Se true, o audiobook aparece na home pública';
COMMENT ON COLUMN audiobooks.require_login IS 'Se true, exige login para reproduzir';
COMMENT ON COLUMN audiobooks.min_subscription_level IS 'Nível mínimo de assinatura: free, premium';