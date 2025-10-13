/**
 * SEGURANÇA: Utilitários de segurança diversos
 */

/**
 * Gera nome de arquivo criptograficamente seguro
 * Usa crypto.getRandomValues() ao invés de Math.random()
 */
export function generateSecureFilename(originalName: string, userId: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
  const nameWithoutExt = originalName.replace(`.${extension}`, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50); // Limitar tamanho
  
  // Gerar sufixo criptograficamente seguro
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const randomSuffix = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);
  
  const timestamp = Date.now();
  
  return `${userId}/${timestamp}_${nameWithoutExt}_${randomSuffix}.${extension}`;
}

/**
 * Wrapper para fetch com timeout
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sanitiza mensagem de erro para não expor detalhes internos
 */
export function sanitizeErrorMessage(error: any): string {
  if (!error) return 'Erro desconhecido';
  
  const message = error.message || String(error);
  
  // Lista de padrões que indicam informações sensíveis
  const sensitivePatterns = [
    /token/i,
    /password/i,
    /secret/i,
    /key/i,
    /authorization/i,
    /credential/i,
    /api[_-]?key/i,
    /connection string/i,
    /database/i,
    /sql/i,
    /stack trace/i,
  ];
  
  // Se contém informação sensível, retorna mensagem genérica
  if (sensitivePatterns.some(pattern => pattern.test(message))) {
    console.error('[Security] Mensagem de erro sensível bloqueada:', message);
    return 'Ocorreu um erro. Tente novamente mais tarde.';
  }
  
  // Limitar tamanho da mensagem
  return message.substring(0, 200);
}

/**
 * Verifica se a conexão é HTTPS (exceto localhost)
 */
export function ensureHttps(): boolean {
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  if (!isLocalhost && window.location.protocol !== 'https:') {
    console.error('[Security] HTTPS obrigatório em produção!');
    
    // Redirecionar para HTTPS
    if (window.location.protocol === 'http:') {
      const httpsUrl = window.location.href.replace('http:', 'https:');
      window.location.replace(httpsUrl);
      return false;
    }
  }
  
  return true;
}

/**
 * Adiciona proteção contra clickjacking em páginas administrativas
 */
export function enableClickjackingProtection(): void {
  // Verificar se está sendo carregado em iframe
  if (window.self !== window.top) {
    // Está em iframe - prevenir renderização
    console.error('[Security] Clickjacking detectado! Bloqueando renderização.');
    
    // Tornar página invisível
    document.body.style.display = 'none';
    
    // Tentar quebrar o frame (frame busting)
    try {
      window.top!.location = window.self.location;
    } catch (e) {
      // Se não conseguir, mostrar aviso
      const warning = document.createElement('div');
      warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: sans-serif;
        z-index: 999999;
      `;
      warning.innerHTML = `
        <div style="text-align: center;">
          <h1>⚠️ Aviso de Segurança</h1>
          <p>Esta página não pode ser exibida em um iframe por razões de segurança.</p>
          <p><a href="${window.location.href}" target="_blank">Clique aqui para abrir em uma nova aba</a></p>
        </div>
      `;
      document.body.appendChild(warning);
      document.body.style.display = 'block';
    }
  }
}

/**
 * Rate limiting mais robusto no lado do cliente
 * Usa múltiplos fatores para dificultar bypass
 */
const rateLimitStore = new Map<string, {
  count: number;
  resetAt: number;
  fingerprint: string;
}>();

function generateFingerprint(): string {
  // Criar "fingerprint" baseado em múltiplos fatores
  const factors = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ].join('|');
  
  // Hash simples (não é criptográfico, apenas dificulta bypass)
  let hash = 0;
  for (let i = 0; i < factors.length; i++) {
    const char = factors.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return hash.toString(36);
}

export function checkEnhancedRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const fingerprint = generateFingerprint();
  const record = rateLimitStore.get(key);
  
  // Se não existe registro ou expirou
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { 
      count: 1, 
      resetAt: now + windowMs,
      fingerprint 
    });
    return true;
  }
  
  // Verificar se fingerprint mudou (possível tentativa de bypass)
  if (record.fingerprint !== fingerprint) {
    console.warn('[Security] Fingerprint mudou - possível tentativa de bypass de rate limit');
    // Não reseta contador - mantém bloqueio
  }
  
  // Se excedeu limite
  if (record.count >= maxRequests) {
    console.warn(`[Security] Rate limit excedido: ${key} (${record.count}/${maxRequests})`);
    return false;
  }
  
  // Incrementar contador
  record.count++;
  return true;
}

/**
 * Limpa dados sensíveis do console em produção
 */
export function disableConsoleInProduction(): void {
  if (import.meta.env.PROD) {
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    // Manter console.error e console.warn para debugging crítico
  }
}

/**
 * Adiciona log de auditoria no cliente antes de enviar ao servidor
 */
export interface AuditLog {
  action: string;
  details: Record<string, any>;
  timestamp: string;
  userAgent: string;
}

const auditLogQueue: AuditLog[] = [];

export function logClientAudit(action: string, details: Record<string, any> = {}): void {
  const log: AuditLog = {
    action,
    details,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
  
  auditLogQueue.push(log);
  console.info('[Audit]', action, details);
  
  // Manter apenas últimos 50 logs
  if (auditLogQueue.length > 50) {
    auditLogQueue.shift();
  }
}

export function getAuditLogs(): AuditLog[] {
  return [...auditLogQueue];
}

