import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./App.css";

// Enregistrer le service worker pour la PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW enregistré: ', registration);
      })
      .catch((registrationError) => {
        console.log('Échec de l\'enregistrement du SW: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
