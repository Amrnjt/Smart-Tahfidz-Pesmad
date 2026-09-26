import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { installCloudCommitGate } from './services/cloudCommitGate';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import './styles/app.css';

// P0.3: Firestore is the commit gate; LocalStorage remains cache only.
installCloudCommitGate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);

window.requestAnimationFrame(() => {
  window.__PESMAD_APP_READY__?.();
});
