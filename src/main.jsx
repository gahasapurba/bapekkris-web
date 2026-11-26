import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queries';
import { FeedbackProvider } from './ui';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Offline support: precached app shell + cached public content (see VitePWA in vite.config.js).
// Not registered in development so the dev server always serves fresh modules.
if (import.meta.env.PROD) registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
