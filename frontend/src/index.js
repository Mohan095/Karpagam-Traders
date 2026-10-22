import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Register production-ready service worker for offline support and PWA installability
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    console.log('Karpagam Traders PWA update available.');
  },
  onSuccess: (registration) => {
    console.log('Karpagam Traders PWA successfully registered for offline caching.');
  }
});
