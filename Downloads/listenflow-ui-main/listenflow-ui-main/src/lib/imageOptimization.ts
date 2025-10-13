/**
 * OTIMIZAÇÃO: Sistema avançado de otimização de imagens
 * Responsive images, progressive loading, blur-up placeholders
 */

export interface ImageConfig {
  src: string;
  srcSet?: string;
  sizes?: string;
  blurDataUrl?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * Gera URLs de imagens em múltiplos tamanhos para Supabase Storage
 * Supabase transforma automaticamente com query params
 */
export function generateResponsiveImageUrls(originalUrl: string, aspectRatio: 'cover' | 'banner' = 'cover'): {
  srcSet: string;
  sizes: string;
} {
  if (!originalUrl || originalUrl === '/placeholder.svg') {
    return { srcSet: '', sizes: '' };
  }

  // Tamanhos padrão para capas de audiobook
  const coverSizes = [320, 640, 960, 1280];
  
  // Gerar srcSet com transformações do Supabase
  const srcSetParts = coverSizes.map(width => {
    // Supabase Storage permite transformações via query params
    const transformedUrl = `${originalUrl}?width=${width}&quality=85`;
    return `${transformedUrl} ${width}w`;
  });

  const srcSet = srcSetParts.join(', ');

  // Sizes baseado em breakpoints típicos
  const sizes = aspectRatio === 'cover' 
    ? '(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 220px'
    : '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px';

  return { srcSet, sizes };
}

/**
 * Gera blur-up placeholder (tiny image encoded como data URL)
 */
export function generateBlurPlaceholder(width: number = 20, height: number = 30): string {
  // SVG blur placeholder (mais leve que base64)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="20"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1"/>
        <feGaussianBlur stdDeviation="20"/>
      </filter>
      <rect width="100%" height="100%" fill="#1a1a1a" filter="url(#b)"/>
      <rect width="100%" height="100%" fill="url(#gradient)" opacity="0.3"/>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#a855f7;stop-opacity:0.3" />
        </linearGradient>
      </defs>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Hook para progressive image loading
 */
export function useProgressiveImage(src: string, blurDataUrl?: string): {
  currentSrc: string;
  isLoading: boolean;
  blur: boolean;
} {
  const [currentSrc, setCurrentSrc] = useState(blurDataUrl || generateBlurPlaceholder());
  const [isLoading, setIsLoading] = useState(true);
  const [blur, setBlur] = useState(true);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
      
      // Remover blur após pequeno delay para transição suave
      setTimeout(() => setBlur(false), 50);
    };

    img.onerror = () => {
      setIsLoading(false);
      setBlur(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { currentSrc, isLoading, blur };
}

/**
 * Componente otimizado de imagem com todas as melhorias
 */
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'cover' | 'banner';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  aspectRatio = 'cover',
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const blurPlaceholder = generateBlurPlaceholder();
  const { currentSrc, blur } = useProgressiveImage(src, blurPlaceholder);
  const { srcSet, sizes } = generateResponsiveImageUrls(src, aspectRatio);

  return (
    <img
      src={currentSrc}
      srcSet={srcSet || undefined}
      sizes={sizes || undefined}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`${className} ${blur ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
      style={{
        willChange: blur ? 'filter' : 'auto',
      }}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

/**
 * Gera placeholder shimmer (loading skeleton)
 */
export function ShimmerPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-muted via-muted-foreground/20 to-muted ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Detecta se imagem precisa ser otimizada
 */
export function needsOptimization(url: string, currentSize: number): boolean {
  // Se maior que 200KB, precisa otimizar
  return currentSize > 200 * 1024;
}

/**
 * Calcula tamanho ideal de imagem para viewport
 */
export function getIdealImageSize(containerWidth: number, devicePixelRatio: number = window.devicePixelRatio || 1): number {
  // Ajustar para DPR (Retina, etc)
  const idealWidth = Math.ceil(containerWidth * devicePixelRatio);
  
  // Arredondar para tamanhos padrão (performance de cache)
  const standardSizes = [320, 640, 960, 1280, 1920];
  
  return standardSizes.find(size => size >= idealWidth) || 1920;
}

/**
 * Preload de imagem crítica
 */
export function preloadImage(url: string, priority: 'high' | 'low' = 'low'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  
  // @ts-ignore - fetchpriority é experimental
  if ('fetchPriority' in link) {
    // @ts-ignore
    link.fetchPriority = priority;
  }
  
  document.head.appendChild(link);
}

