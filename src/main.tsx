import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import './i18n';

window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event?.reason?.message || event?.reason || '');
  if (reasonStr.includes('WebSocket') || reasonStr.includes('closed without opened') || reasonStr.includes('Failed to fetch')) {
    console.warn('Network / WebSocket connection fluctuation captured gracefully:', reasonStr);
    event.preventDefault();
    return;
  }
  console.warn('Unhandled promise rejection captured globally:', event.reason);
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


