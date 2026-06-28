import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './store/StoreContext.tsx';
import './index.css';

// Global error handler to prevent silent white page
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px;">
        <h2 style="margin-top: 0;">Une erreur critique est survenue</h2>
        <p>L'application n'a pas pu démarrer correctement. Cela est souvent dû à des variables d'environnement manquantes ou à une erreur de connexion à la base de données.</p>
        <pre style="background: rgba(0,0,0,0.05); padding: 10px; overflow: auto; font-size: 12px;">${message}</pre>
        <button onclick="window.location.reload()" style="background: #721c24; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Réessayer</button>
      </div>
    `;
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
