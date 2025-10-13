/**
 * SEGURANÇA: Configuração centralizada de CORS
 * Define origens permitidas e headers seguros
 */

// Lista de origens permitidas (adicionar domínio de produção aqui)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://vpehklrzzgklskapnfmk.supabase.co',
  // Adicionar domínio de produção: 'https://seudominio.com'
];

/**
 * Valida se a origem da requisição é permitida
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Retorna headers CORS seguros baseados na origem
 */
export function getCorsHeaders(origin: string | null): HeadersInit {
  // Se origem não é permitida, retorna headers restritivos
  if (!isOriginAllowed(origin)) {
    return {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0], // Fallback para localhost
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Headers de segurança adicionais para todas as respostas
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Combina headers CORS com headers de segurança
 */
export function getSecureHeaders(origin: string | null, contentType = 'application/json'): HeadersInit {
  return {
    ...getCorsHeaders(origin),
    ...SECURITY_HEADERS,
    'Content-Type': contentType,
  };
}

