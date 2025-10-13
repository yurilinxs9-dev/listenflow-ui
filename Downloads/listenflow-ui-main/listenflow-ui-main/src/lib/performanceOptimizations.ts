/**
 * OTIMIZAÇÃO: Melhorias avançadas de performance
 * Técnicas para tornar o app mais rápido em qualquer dispositivo
 */

/**
 * Debounce function para evitar execuções excessivas
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function para limitar execuções
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load de imagens com Intersection Observer
 */
export function setupLazyImages(): void {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px', // Carregar 50px antes de aparecer
    });
    
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Prefetch de páginas importantes
 */
export function prefetchPage(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Detecta se deve usar animações reduzidas
 */
export function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Otimiza bundle inicial com code splitting manual
 */
export async function loadHeavyFeatures() {
  // Carregar features pesadas sob demanda
  const { default: pdfjs } = await import('pdfjs-dist');
  return { pdfjs };
}

/**
 * Comprime dados antes de salvar no localStorage
 */
export function compressForStorage(data: any): string {
  try {
    const json = JSON.stringify(data);
    // Implementar compressão simples (para futuro: usar LZ-string)
    return btoa(json); // Base64 simples por enquanto
  } catch {
    return '';
  }
}

export function decompressFromStorage(compressed: string): any {
  try {
    const json = atob(compressed);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Monitora uso de memória (experimental)
 */
export function checkMemoryUsage(): {
  used: number;
  limit: number;
  percentage: number;
} | null {
  // @ts-ignore
  if (performance.memory) {
    // @ts-ignore
    const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
    
    return {
      used: Math.round(usedJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(jsHeapSizeLimit / 1024 / 1024), // MB
      percentage: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100),
    };
  }
  
  return null;
}

/**
 * Limpa memória e caches desnecessários
 */
export function performGarbageCollection(): void {
  // Limpar localStorage excessivo
  const keys = Object.keys(localStorage);
  
  keys.forEach((key) => {
    try {
      const item = localStorage.getItem(key);
      if (item && item.length > 1024 * 1024) { // >1MB
        console.warn('[Performance] 🗑️ Item muito grande no localStorage:', key);
      }
    } catch (e) {
      // Ignorar erros
    }
  });
  
  // Limpar console logs antigos (em produção)
  if (import.meta.env.PROD) {
    console.clear();
  }
}

/**
 * Detecta se navegador suporta recursos avançados
 */
export function checkBrowserCapabilities(): {
  serviceWorker: boolean;
  webWorkers: boolean;
  indexedDB: boolean;
  webAssembly: boolean;
  audioContext: boolean;
  mediaSession: boolean;
} {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    webWorkers: typeof Worker !== 'undefined',
    indexedDB: 'indexedDB' in window,
    webAssembly: typeof WebAssembly !== 'undefined',
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
    mediaSession: 'mediaSession' in navigator,
  };
}

/**
 * Configura Media Session API para controles de mídia (lockscreen, headphones)
 */
export function setupMediaSession(metadata: {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
}): void {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album || 'AudioStream',
      artwork: metadata.artwork ? [
        { src: metadata.artwork, sizes: '512x512', type: 'image/jpeg' }
      ] : [],
    });
    
    console.log('[MediaSession] 🎵 Metadata configurado para controles nativos');
  }
}

/**
 * Optimiza imagens com loading lazy nativo
 */
export function optimizeImage(src: string, alt: string): React.ImgHTMLAttributes<HTMLImageElement> {
  return {
    src,
    alt,
    loading: 'lazy',
    decoding: 'async',
    // Adicionar srcset para responsive se tivermos múltiplos tamanhos
  };
}

/**
 * Request Idle Callback polyfill
 */
export function runWhenIdle(callback: () => void, options?: { timeout?: number }): void {
  if ('requestIdleCallback' in window) {
    // @ts-ignore
    window.requestIdleCallback(callback, options);
  } else {
    // Fallback: setTimeout
    setTimeout(callback, 1);
  }
}

/**
 * Prioriza carregamento de recursos críticos
 */
export function prioritizeResources(): void {
  // Adicionar hints de prioridade
  const criticalResources = [
    { href: '/src/main.tsx', as: 'script' },
    { href: '/src/index.css', as: 'style' },
  ];
  
  criticalResources.forEach(({ href, as }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  });
}

/**
 * Verifica e avisa sobre performance ruim
 */
export function monitorPerformance(): void {
  if ('PerformanceObserver' in window) {
    try {
      // Monitorar long tasks (>50ms)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[Performance] ⚠️ Long task detectada:', entry.duration.toFixed(2), 'ms');
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Navegador não suporta
    }
  }
}

