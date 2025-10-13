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
      // SEGURANÇA: Prevenir emails maliciosos com patterns XSS avançados
      const dangerousPatterns = [
        /<script[\s\S]*?>/i,        // script tags
        /javascript:/i,              // javascript: protocol
        /on\w+\s*=/i,               // event handlers (onclick, onload, etc)
        /<iframe[\s\S]*?>/i,        // iframe tags
        /<object[\s\S]*?>/i,        // object tags
        /<embed[\s\S]*?>/i,         // embed tags
        /<svg[\s\S]*?>/i,           // svg tags (podem conter scripts)
        /data:text\/html/i,         // data URLs com HTML
        /vbscript:/i,               // vbscript protocol
        /<img[\s\S]*?on\w+/i,       // img tags com event handlers
        /<link[\s\S]*?href[\s\S]*?javascript:/i, // link com javascript
      ];
      return !dangerousPatterns.some((pattern) => pattern.test(email));
    },
    { message: 'Email contém caracteres inválidos' }
  );

// Schema para senha com requisitos de segurança FORTES (NIST recomenda 12+)
export const passwordSchema = z
  .string()
  .min(12, 'Senha deve ter no mínimo 12 caracteres') // Aumentado de 8 para 12
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
  )
  .refine(
    (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    'Senha deve conter pelo menos um caractere especial'
  );

// Schema para nome de exibição
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Nome deve ter no mínimo 2 caracteres')
  .max(100, 'Nome muito longo')
  .refine(
    (name) => {
      // SEGURANÇA: Prevenir XSS em nomes com patterns avançados
      const dangerousPatterns = [
        /<script[\s\S]*?>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe[\s\S]*?>/i,
        /<img[\s\S]*?>/i,
        /<svg[\s\S]*?>/i,
        /<object[\s\S]*?>/i,
        /<embed[\s\S]*?>/i,
        /data:text\/html/i,
        /vbscript:/i,
        /<style[\s\S]*?>/i,
        /expression\s*\(/i,         // CSS expression()
        /import\s+/i,               // CSS @import
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
      const dangerousPatterns = [
        /<script[\s\S]*?>/i,
        /javascript:/i,
        /<iframe[\s\S]*?>/i,
        /<svg[\s\S]*?>/i,
        /on\w+\s*=/i,
        /<object[\s\S]*?>/i,
        /<embed[\s\S]*?>/i,
      ];
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
      const dangerousPatterns = [
        /<script[\s\S]*?>/i,
        /javascript:/i,
        /<iframe[\s\S]*?>/i,
        /<svg[\s\S]*?>/i,
        /on\w+\s*=/i,
        /<object[\s\S]*?>/i,
        /<embed[\s\S]*?>/i,
        /data:text\/html/i,
      ];
      return !dangerousPatterns.some((pattern) => pattern.test(desc));
    },
    { message: 'Descrição contém caracteres inválidos' }
  )
  .optional();

/**
 * SEGURANÇA: Função robusta para sanitizar HTML
 * Remove tags potencialmente perigosas e event handlers
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  return html
    // Remove script tags e conteúdo
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object e embed tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove style tags (podem conter expression())
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove link tags com javascript
    .replace(/<link\b[^<]*(?:href\s*=\s*["']?javascript:)[^>]*>/gi, '')
    // Remove svg tags (podem conter scripts)
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    // Remove protocols perigosos
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    // Remove event handlers (onclick, onload, onerror, etc)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove CSS expression()
    .replace(/expression\s*\([^)]*\)/gi, '')
    // Remove import em CSS
    .replace(/@import\s+/gi, '')
    // Remove meta refresh
    .replace(/<meta\b[^<]*(?:http-equiv\s*=\s*["']?refresh)[^>]*>/gi, '');
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
