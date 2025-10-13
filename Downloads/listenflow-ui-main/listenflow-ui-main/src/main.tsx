import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ensureHttps, disableConsoleInProduction } from "./lib/securityUtils";
import { registerServiceWorker } from "./lib/serviceWorker";
import { 
  monitorPerformance, 
  runWhenIdle, 
  prioritizeResources,
  setupLazyImages 
} from "./lib/performanceOptimizations";
import { getNetworkInfo, getDeviceInfo } from "./lib/networkDetection";

// SEGURANÇA: Verificações iniciais
ensureHttps();
disableConsoleInProduction();

// OTIMIZAÇÃO: Log de contexto inicial
const networkInfo = getNetworkInfo();
const deviceInfo = getDeviceInfo();
console.log('[App] 🌐 Rede:', networkInfo.type, networkInfo.quality);
console.log('[App] 📱 Dispositivo:', deviceInfo.type, deviceInfo.screenSize);

// OTIMIZAÇÃO: Priorizar recursos críticos
prioritizeResources();

// OTIMIZAÇÃO: Service Worker para cache offline (apenas em produção)
if (import.meta.env.PROD) {
  registerServiceWorker().then((registration) => {
    if (registration) {
      console.log('[App] ✅ Service Worker ativo - Cache offline habilitado');
    }
  });
  
  // Monitorar performance
  runWhenIdle(() => {
    monitorPerformance();
    setupLazyImages();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
