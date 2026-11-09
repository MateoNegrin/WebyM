import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SessionProvider } from '@batalla/hooks';
import App from './components/App.jsx';
import { ToastProvider } from './components/ui.jsx';
import { apiConfig } from './config.js';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionProvider config={apiConfig} storage={localStorage}>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </SessionProvider>
  </StrictMode>,
);
