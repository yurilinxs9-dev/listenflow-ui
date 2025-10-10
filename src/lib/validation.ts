import { z } from 'zod';

/**
 * SEGURANÇA: Schemas de validação centralizados usando Zod
 * Previne ataques de injeção e valida dados antes do processamento
 */

// Schema para email com validação rigorosa
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .max(255, 'Email muito longo')
  .toLowerCase()
  .refine(
    (email) => {
      // Prevenir emails maliciosos
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,
        /<iframe/i,
      ];
      return !dangerousPatterns.some((pattern) => pattern.test(email));
    },
    { message: 'Email contém caracteres inválidos' }
  );

// Schema para senha com requisitos de segurança
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(128, 'Senha muito longa')
  .refine(
    (password) => /[a-z]/.test(password),
    'Senha deve conter pelo menos uma letra minúscula'
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    'Senha deve conter pelo menos uma letra maiúscula'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Senha deve conter pelo menos um número'
  );

// Schema para nome de exibição
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Nome deve ter no mínimo 2 caracteres')
  .max(100, 'Nome muito longo')
  .refine(
    (name) => {
      // Prevenir XSS em nomes
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,
        /<iframe/i,
        /<img/i,
      ];
      return !dangerousPatterns.some((pattern) => pattern.test(name));
    },
    { message: 'Nome contém caracteres inválidos' }
  );

// Schema para login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Schema para registro
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

// Schema para título de audiobook
export const audiobookTitleSchema = z
  .string()
  .trim()
  .min(1, 'Título é obrigatório')
  .max(200, 'Título muito longo')
  .refine(
    (title) => {
      const dangerousPatterns = [/<script/i, /javascript:/i, /<iframe/i];
      return !dangerousPatterns.some((pattern) => pattern.test(title));
    },
    { message: 'Título contém caracteres inválidos' }
  );

// Schema para descrição
export const descriptionSchema = z
  .string()
  .max(2000, 'Descrição muito longa')
  .refine(
    (desc) => {
      const dangerousPatterns = [/<script/i, /javascript:/i, /<iframe/i];
      return !dangerousPatterns.some((pattern) => pattern.test(desc));
    },
    { message: 'Descrição contém caracteres inválidos' }
  )
  .optional();

/**
 * Função auxiliar para sanitizar HTML
 * Remove tags potencialmente perigosas
 */
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
};

/**
 * Validação de rate limiting do lado do cliente
 * Previne spam antes mesmo de chegar ao servidor
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const checkClientRateLimit = (
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};
