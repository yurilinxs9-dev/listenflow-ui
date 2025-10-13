import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ensureHttps, disableConsoleInProduction } from "./lib/securityUtils";

// SEGURANÇA: Verificações iniciais
ensureHttps();
disableConsoleInProduction();

createRoot(document.getElementById("root")!).render(<App />);
