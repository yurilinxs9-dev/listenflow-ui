-- Tornar todos os audiobooks globais para acesso por usuários aprovados
UPDATE audiobooks 
SET is_global = true;

-- Alterar o padrão para novos audiobooks serem globais
ALTER TABLE audiobooks 
ALTER COLUMN is_global SET DEFAULT true;

-- Comentário: Agora todos os usuários com status 'approved' 
-- poderão acessar qualquer audiobook da plataforma