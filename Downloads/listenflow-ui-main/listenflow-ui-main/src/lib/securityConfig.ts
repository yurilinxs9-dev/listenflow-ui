/**
 * SEGURANÇA: Configurações centralizadas de segurança
 */

/**
 * Requisitos mínimos de senha (NIST recomenda 12+)
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 12, // Aumentado de 8 para 12
  requireLowercase: true,
  requireUppercase: true,
  requireNumber: true,
  requireSpecialChar: true, // Novo requisito
  maxLength: 128,
};

/**
 * Configurações de rate limiting
 */
export const RATE_LIMITS = {
  login: { maxRequests: 5, windowMs: 60000 }, // 5 tentativas por minuto
  signup: { maxRequests: 3, windowMs: 300000 }, // 3 tentativas em 5 minutos
  upload: { maxRequests: 10, windowMs: 300000 }, // 10 uploads em 5 minutos
  apiGeneral: { maxRequests: 100, windowMs: 60000 }, // 100 req/min geral
};

/**
 * Tamanhos máximos de arquivo
 */
export const FILE_SIZE_LIMITS = {
  audio: 5 * 1024 * 1024 * 1024, // 5GB
  image: 10 * 1024 * 1024, // 10MB
  document: 50 * 1024 * 1024, // 50MB
};

/**
 * Configurações de sessão
 */
export const SESSION_CONFIG = {
  timeout: 24 * 60 * 60 * 1000, // 24 horas
  refreshThreshold: 5 * 60 * 1000, // Renovar 5 minutos antes de expirar
  extendOnActivity: true,
};

/**
 * Domínios permitidos (adicionar domínio de produção)
 */
export const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'vpehklrzzgklskapnfmk.supabase.co',
  // Adicionar: 'seudominio.com.br'
];

/**
 * Configurações de Content Security Policy
 */
export const CSP_CONFIG = {
  development: {
    scriptSrc: ["'self'", "'wasm-unsafe-eval'", "https://*.supabase.co"],
    styleSrc: ["'self'", "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='"],
    connectSrc: [
      "'self'", 
      "https://*.supabase.co", 
      "wss://*.supabase.co",
      "https://openlibrary.org",
      "https://www.googleapis.com",
      "https://ai.gateway.lovable.dev"
    ],
  },
  production: {
    // CSP mais restritivo para produção
    scriptSrc: ["'self'", "https://*.supabase.co"],
    styleSrc: ["'self'"],
    connectSrc: [
      "'self'", 
      "https://*.supabase.co", 
      "wss://*.supabase.co"
    ],
  },
};

/**
 * Configurações de auditoria
 */
export const AUDIT_CONFIG = {
  logRetentionDays: 90, // Manter logs por 90 dias
  suspiciousActivityThreshold: 10, // Marcar como suspeito após 10 falhas
  alertAdminOnSuspicious: true,
};

/**
 * Features de segurança habilitadas
 */
export const SECURITY_FEATURES = {
  enforceHttps: true,
  clickjackingProtection: true,
  xssProtection: true,
  csrfProtection: true,
  rateLimiting: true,
  auditLogging: true,
  mimeTypeValidation: true,
  fileSignatureValidation: true,
  passwordStrengthEnforcement: true,
  twoFactorAuthAvailable: false, // TODO: Implementar 2FA
};

/**
 * Lista de IPs bloqueados (exemplo - deveria vir do backend)
 */
export const BLOCKED_IPS: string[] = [
  // Adicionar IPs maliciosos conhecidos
];

/**
 * Padrões de conteúdo suspeito
 */
export const SUSPICIOUS_PATTERNS = {
  sql: [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
  ],
  xss: [
    /<script[\s\S]*?>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[\s\S]*?>/i,
    /<svg[\s\S]*?onload/i,
  ],
  pathTraversal: [
    /\.\.[\/\\]/,
    /[\/\\]\.\.$/,
    /^\.\.$/,
  ],
};

/**
 * Headers de segurança recomendados
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Mensagens de erro genéricas (não expor detalhes internos)
 */
export const GENERIC_ERROR_MESSAGES = {
  auth: 'Credenciais inválidas',
  forbidden: 'Acesso negado',
  notFound: 'Recurso não encontrado',
  serverError: 'Erro interno do servidor',
  validation: 'Dados inválidos fornecidos',
  rateLimit: 'Muitas requisições. Tente novamente mais tarde.',
};

