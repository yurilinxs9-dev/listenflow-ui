/**
 * OTIMIZAÇÃO: Registro e gerenciamento de Service Worker
 * Habilita cache offline e melhor performance
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] ⚠️ Service Worker não suportado neste navegador');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] ✅ Service Worker registrado com sucesso');
    
    // Verificar atualizações
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] 🔄 Nova versão disponível!');
            // Pode mostrar toast para usuário recarregar
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[SW] ❌ Erro ao registrar:', error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const unregistered = await registration.unregister();
      console.log('[SW] 🗑️ Service Worker removido');
      return unregistered;
    }
    return false;
  } catch (error) {
    console.error('[SW] ❌ Erro ao remover:', error);
    return false;
  }
}

export function sendMessageToSW(message: any): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

export function clearAllCaches(): void {
  sendMessageToSW({ type: 'CLEAR_CACHE' });
}

export function cacheAudioUrl(url: string): void {
  sendMessageToSW({ type: 'CACHE_AUDIO', url });
}

