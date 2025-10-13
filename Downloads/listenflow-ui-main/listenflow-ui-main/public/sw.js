/**
 * SERVICE WORKER - Cache offline e otimização de performance
 * Permite reprodução de áudios mesmo sem conexão
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `listenflow-cache-${CACHE_VERSION}`;
const AUDIO_CACHE = `listenflow-audio-${CACHE_VERSION}`;
const IMAGE_CACHE = `listenflow-images-${CACHE_VERSION}`;

// Recursos essenciais para cache imediato
const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] ✅ Cache criado');
      return cache.addAll(ESSENTIAL_ASSETS);
    }).catch((err) => {
      console.error('[SW] ❌ Erro ao criar cache:', err);
    })
  );
  
  // Ativar imediatamente
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] 🔄 Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Deletar caches antigos
          if (cacheName.startsWith('listenflow-') && cacheName !== CACHE_NAME) {
            console.log('[SW] 🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar controle imediatamente
  return self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégias diferentes por tipo de recurso
  
  // 1. ÁUDIO: Cache-first com fallback para network
  if (request.destination === 'audio' || url.pathname.includes('.mp3') || url.pathname.includes('.m4a')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] 🎵 Áudio do cache:', url.pathname);
            return cachedResponse;
          }
          
          // Não está em cache, buscar da rede
          return fetch(request).then((networkResponse) => {
            // Cache apenas se for sucesso
            if (networkResponse.ok && networkResponse.status === 200) {
              console.log('[SW] 💾 Salvando áudio no cache:', url.pathname);
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // 2. IMAGENS: Cache-first com expiração
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Verificar se não está muito antigo (7 dias)
            const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
            const now = new Date();
            const daysSince = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSince < 7) {
              return cachedResponse;
            }
          }
          
          // Buscar da rede e atualizar cache
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Se falhar e tiver cache antigo, usar mesmo assim
            return cachedResponse || new Response('Imagem não disponível', { status: 404 });
          });
        });
      })
    );
    return;
  }
  
  // 3. API CALLS: Network-first com fallback para cache
  if (url.pathname.includes('/functions/') || url.pathname.includes('/rest/')) {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        // Cache respostas de sucesso (exceto mutations)
        if (networkResponse.ok && request.method === 'GET') {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se falhar, tentar cache
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline - sem cache disponível', { status: 503 });
        });
      })
    );
    return;
  }
  
  // 4. OUTROS: Network-first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((cachedResponse) => {
        return cachedResponse || new Response('Offline', { status: 503 });
      });
    })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('listenflow-')) {
              console.log('[SW] 🗑️ Limpando cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'CACHE_AUDIO') {
    const { url } = event.data;
    event.waitUntil(
      caches.open(AUDIO_CACHE).then((cache) => {
        console.log('[SW] 💾 Pré-cacheando áudio:', url);
        return cache.add(url);
      })
    );
  }
});

// Sync em background (para futuras implementações)
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  // Implementar sincronização de progresso offline
  console.log('[SW] 💾 Sincronizando progresso offline...');
  // TODO: Implementar
}

