
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { AuthProvider } from '@/context/AuthProvider';

import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Check that index.html contains <div id="root"></div>.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
