/**
 * OTIMIZAÇÃO: Sistema avançado de detecção de rede e dispositivo
 * Permite adaptar streaming para melhor experiência em qualquer cenário
 */

// Tipos de conexão (Network Information API)
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';

// Tipos de dispositivo
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv';

// Qualidade da conexão
export type NetworkQuality = 'poor' | 'moderate' | 'good' | 'excellent';

export interface NetworkInfo {
  type: ConnectionType;
  quality: NetworkQuality;
  downlink: number; // Mbps
  rtt: number; // Round-trip time em ms
  saveData: boolean; // Modo economia de dados
}

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTouch: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  memory: number | null; // GB (se disponível)
  cores: number;
  hasGoodPerformance: boolean;
}

/**
 * Detecta tipo e qualidade da conexão usando Network Information API
 */
export function getNetworkInfo(): NetworkInfo {
  // @ts-ignore - Network Information API não está em todos os tipos
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    // Fallback: assumir conexão moderada
    return {
      type: 'unknown',
      quality: 'moderate',
      downlink: 5,
      rtt: 100,
      saveData: false,
    };
  }

  const effectiveType = connection.effectiveType as string;
  const downlink = connection.downlink || 5; // Mbps
  const rtt = connection.rtt || 100; // ms
  const saveData = connection.saveData || false;

  // Determinar qualidade baseado em múltiplos fatores
  let quality: NetworkQuality = 'moderate';
  
  if (saveData) {
    quality = 'poor'; // Usuário ativou economia de dados
  } else if (effectiveType === '4g' && downlink > 10 && rtt < 100) {
    quality = 'excellent';
  } else if (effectiveType === '4g' && downlink > 5) {
    quality = 'good';
  } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink < 5)) {
    quality = 'moderate';
  } else {
    quality = 'poor'; // 2g ou slow-2g
  }

  return {
    type: effectiveType as ConnectionType,
    quality,
    downlink,
    rtt,
    saveData,
  };
}

/**
 * Detecta informações do dispositivo
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|ipod/.test(ua);
  const isTablet = /tablet|ipad/.test(ua) || (isMobile && window.innerWidth > 768);
  const isTV = /tv|smarttv|googletv|appletv/.test(ua);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Detectar tipo
  let type: DeviceType = 'desktop';
  if (isTV) type = 'tv';
  else if (isTablet) type = 'tablet';
  else if (isMobile) type = 'mobile';
  
  // Detectar tamanho da tela
  const width = window.innerWidth;
  let screenSize: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';
  if (width < 640) screenSize = 'small';
  else if (width < 1024) screenSize = 'medium';
  else if (width < 1920) screenSize = 'large';
  else screenSize = 'xlarge';
  
  // Detectar memória (se disponível)
  // @ts-ignore
  const memory = navigator.deviceMemory || null; // GB
  
  // Detectar cores
  const cores = navigator.hardwareConcurrency || 4;
  
  // Determinar se tem boa performance
  const hasGoodPerformance = 
    (!isMobile || (memory && memory >= 4)) && // Mobile com 4GB+ ou desktop
    cores >= 4 && // 4+ cores
    screenSize !== 'small'; // Tela não muito pequena

  return {
    type,
    isMobile: isMobile && !isTablet,
    isTouch,
    screenSize,
    memory,
    cores,
    hasGoodPerformance,
  };
}

/**
 * Configurações otimizadas de streaming baseadas em rede + dispositivo
 */
export interface StreamingConfig {
  preload: 'none' | 'metadata' | 'auto';
  bufferSize: number; // bytes
  enablePrefetch: boolean;
  enableCache: boolean;
  chunkSize: number; // para streaming progressivo
  maxConcurrentDownloads: number;
  useCompression: boolean;
}

/**
 * Retorna configuração otimizada baseada em rede e dispositivo
 */
export function getOptimalStreamingConfig(): StreamingConfig {
  const network = getNetworkInfo();
  const device = getDeviceInfo();
  
  console.log('[NetworkDetection] 📊 Rede:', network.type, network.quality);
  console.log('[NetworkDetection] 📱 Dispositivo:', device.type, device.screenSize);

  // Configuração por cenário
  
  // CENÁRIO 1: Conexão ruim (2G, 3G lento)
  if (network.quality === 'poor' || network.saveData) {
    console.log('[NetworkDetection] ⚠️ Modo economia - Conexão lenta ou saveData ativo');
    return {
      preload: 'metadata', // Só carrega metadados
      bufferSize: 1 * 1024 * 1024, // 1MB (mínimo)
      enablePrefetch: false, // Não prefetch
      enableCache: true, // Cache sempre
      chunkSize: 256 * 1024, // 256KB chunks
      maxConcurrentDownloads: 1, // Um de cada vez
      useCompression: true,
    };
  }
  
  // CENÁRIO 2: Mobile com 3G/4G moderado
  if (device.isMobile && network.quality === 'moderate') {
    console.log('[NetworkDetection] 📱 Modo mobile otimizado - 3G/4G moderado');
    return {
      preload: 'metadata', // Só quando clicar
      bufferSize: 2 * 1024 * 1024, // 2MB
      enablePrefetch: false, // Economizar dados
      enableCache: true,
      chunkSize: 512 * 1024, // 512KB chunks
      maxConcurrentDownloads: 2,
      useCompression: true,
    };
  }
  
  // CENÁRIO 3: Mobile com 4G/5G bom
  if (device.isMobile && network.quality === 'good') {
    console.log('[NetworkDetection] 📱 Modo mobile rápido - 4G/5G');
    return {
      preload: 'auto', // Carrega automaticamente
      bufferSize: 3 * 1024 * 1024, // 3MB
      enablePrefetch: true, // Prefetch moderado
      enableCache: true,
      chunkSize: 1024 * 1024, // 1MB chunks
      maxConcurrentDownloads: 3,
      useCompression: false, // Conexão boa não precisa
    };
  }
  
  // CENÁRIO 4: Desktop/Notebook com conexão boa
  if (!device.isMobile && network.quality === 'good') {
    console.log('[NetworkDetection] 💻 Modo desktop otimizado');
    return {
      preload: 'auto',
      bufferSize: 5 * 1024 * 1024, // 5MB
      enablePrefetch: true,
      enableCache: true,
      chunkSize: 2 * 1024 * 1024, // 2MB chunks
      maxConcurrentDownloads: 4,
      useCompression: false,
    };
  }
  
  // CENÁRIO 5: Desktop/Notebook com conexão excelente (WiFi/Ethernet)
  if (!device.isMobile && network.quality === 'excellent') {
    console.log('[NetworkDetection] 🚀 Modo desktop máximo - WiFi/Ethernet');
    return {
      preload: 'auto',
      bufferSize: 10 * 1024 * 1024, // 10MB (agressivo)
      enablePrefetch: true,
      enableCache: true,
      chunkSize: 4 * 1024 * 1024, // 4MB chunks
      maxConcurrentDownloads: 6,
      useCompression: false,
    };
  }
  
  // CENÁRIO 6: Tablet (meio termo)
  if (device.type === 'tablet') {
    console.log('[NetworkDetection] 📲 Modo tablet');
    return {
      preload: 'auto',
      bufferSize: 4 * 1024 * 1024, // 4MB
      enablePrefetch: true,
      enableCache: true,
      chunkSize: 1024 * 1024, // 1MB chunks
      maxConcurrentDownloads: 3,
      useCompression: network.quality !== 'excellent',
    };
  }
  
  // FALLBACK: Configuração segura/moderada
  console.log('[NetworkDetection] ℹ️ Modo padrão');
  return {
    preload: 'metadata',
    bufferSize: 3 * 1024 * 1024, // 3MB
    enablePrefetch: false,
    enableCache: true,
    chunkSize: 512 * 1024, // 512KB
    maxConcurrentDownloads: 2,
    useCompression: true,
  };
}

/**
 * Hook React para monitorar mudanças de conexão
 */
export function useNetworkInfo(callback?: (info: NetworkInfo) => void) {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return null;
  
  const handleChange = () => {
    const info = getNetworkInfo();
    console.log('[NetworkDetection] 🔄 Conexão mudou:', info.type, info.quality);
    callback?.(info);
  };
  
  connection.addEventListener('change', handleChange);
  
  return () => {
    connection.removeEventListener('change', handleChange);
  };
}

/**
 * Detecta se está em modo economia de bateria
 */
export function isBatterySaverMode(): boolean {
  // @ts-ignore
  if (navigator.getBattery) {
    // Nota: getBattery é async, mas retornamos false como fallback
    return false; // Simplificado - pode ser melhorado
  }
  return false;
}

/**
 * Estima velocidade de download em tempo real
 */
export class DownloadSpeedMonitor {
  private samples: number[] = [];
  private maxSamples = 10;
  
  addSample(bytesLoaded: number, timeMs: number) {
    const mbps = (bytesLoaded * 8) / (timeMs / 1000) / 1_000_000;
    this.samples.push(mbps);
    
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    console.log('[SpeedMonitor] 📊 Velocidade medida:', mbps.toFixed(2), 'Mbps');
  }
  
  getAverageSpeed(): number {
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((a, b) => a + b, 0);
    return sum / this.samples.length;
  }
  
  getQuality(): NetworkQuality {
    const avg = this.getAverageSpeed();
    
    if (avg > 20) return 'excellent'; // >20 Mbps
    if (avg > 10) return 'good';      // 10-20 Mbps
    if (avg > 3) return 'moderate';   // 3-10 Mbps
    return 'poor';                    // <3 Mbps
  }
  
  reset() {
    this.samples = [];
  }
}

/**
 * Recomendações de preload baseadas em contexto
 */
export function getRecommendedPreload(
  network: NetworkInfo,
  device: DeviceInfo,
  isPlaying: boolean
): 'none' | 'metadata' | 'auto' {
  // Se está tocando, sempre auto para continuidade
  if (isPlaying) return 'auto';
  
  // Se economia de dados ativa
  if (network.saveData) return 'none';
  
  // Se conexão ruim
  if (network.quality === 'poor') return 'metadata';
  
  // Se mobile com conexão moderada
  if (device.isMobile && network.quality === 'moderate') return 'metadata';
  
  // Se mobile com conexão boa ou desktop
  return 'auto';
}

/**
 * Calcula tamanho de buffer otimizado
 */
export function getOptimalBufferSize(
  network: NetworkInfo,
  device: DeviceInfo
): number {
  const baseSize = 2 * 1024 * 1024; // 2MB base
  
  // Multiplicadores
  let multiplier = 1;
  
  // Por qualidade de rede
  switch (network.quality) {
    case 'poor': multiplier *= 0.5; break;      // 1MB
    case 'moderate': multiplier *= 1; break;    // 2MB
    case 'good': multiplier *= 2; break;        // 4MB
    case 'excellent': multiplier *= 4; break;   // 8MB
  }
  
  // Por tipo de dispositivo
  if (device.isMobile) {
    multiplier *= 0.75; // Reduz 25% em mobile
  } else if (device.type === 'tablet') {
    multiplier *= 1.25; // Aumenta 25% em tablet
  } else {
    multiplier *= 1.5; // Aumenta 50% em desktop
  }
  
  // Por memória disponível (se conhecido)
  if (device.memory) {
    if (device.memory < 2) multiplier *= 0.5; // <2GB: reduz
    else if (device.memory > 8) multiplier *= 1.5; // >8GB: aumenta
  }
  
  const finalSize = Math.round(baseSize * multiplier);
  
  // Limites: mínimo 512KB, máximo 20MB
  const clampedSize = Math.max(512 * 1024, Math.min(finalSize, 20 * 1024 * 1024));
  
  console.log('[NetworkDetection] 📦 Buffer otimizado:', (clampedSize / 1024 / 1024).toFixed(2), 'MB');
  
  return clampedSize;
}

/**
 * Detecta se deve usar prefetch
 */
export function shouldEnablePrefetch(
  network: NetworkInfo,
  device: DeviceInfo
): boolean {
  // Nunca em economia de dados
  if (network.saveData) return false;
  
  // Nunca em conexão ruim
  if (network.quality === 'poor') return false;
  
  // Mobile apenas com conexão boa ou melhor
  if (device.isMobile) {
    return network.quality === 'good' || network.quality === 'excellent';
  }
  
  // Desktop/Tablet com conexão moderada ou melhor
  return network.quality !== 'poor';
}

/**
 * Listener para mudanças de conexão
 */
export function watchNetworkChanges(callback: (info: NetworkInfo) => void): () => void {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    return () => {}; // Noop
  }
  
  const handler = () => {
    const info = getNetworkInfo();
    callback(info);
  };
  
  connection.addEventListener('change', handler);
  
  // Retorna função de cleanup
  return () => {
    connection.removeEventListener('change', handler);
  };
}

/**
 * Detecta se está em modo economia de bateria (experimental)
 */
export async function checkBatteryStatus(): Promise<{
  level: number;
  charging: boolean;
  lowBattery: boolean;
}> {
  try {
    // @ts-ignore
    if (!navigator.getBattery) {
      return { level: 1, charging: true, lowBattery: false };
    }
    
    // @ts-ignore
    const battery = await navigator.getBattery();
    
    return {
      level: battery.level,
      charging: battery.charging,
      lowBattery: battery.level < 0.2 && !battery.charging, // <20% e não carregando
    };
  } catch {
    return { level: 1, charging: true, lowBattery: false };
  }
}

/**
 * Calcula delay para auto-renovação de URL baseado em contexto
 */
export function getOptimalRenewalDelay(
  expiresIn: number,
  network: NetworkInfo
): number {
  // Base: renovar 2 minutos antes
  let delay = (expiresIn * 1000) - (2 * 60 * 1000);
  
  // Em conexão ruim, renovar 5 minutos antes (mais margem)
  if (network.quality === 'poor') {
    delay = (expiresIn * 1000) - (5 * 60 * 1000);
  }
  
  // Em conexão excelente, pode renovar 1 minuto antes
  if (network.quality === 'excellent') {
    delay = (expiresIn * 1000) - (1 * 60 * 1000);
  }
  
  // Garantir que é positivo
  return Math.max(delay, 30000); // Mínimo 30 segundos
}

/**
 * Sugestão de preload para listas/carrosséis
 */
export function shouldPreloadInList(
  position: number,
  totalItems: number,
  network: NetworkInfo,
  device: DeviceInfo
): boolean {
  // Nunca em modo economia
  if (network.saveData) return false;
  
  // Apenas primeiros itens
  const maxPreload = network.quality === 'excellent' ? 5 : 
                     network.quality === 'good' ? 3 : 1;
  
  return position < maxPreload;
}

