import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installCloudCommitGate } from './services/cloudCommitGate';
import { installRoleScopedSync } from './services/roleScopedSync';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import './index.css';

// P0.3: Firestore is the commit gate; LocalStorage remains cache only.
installCloudCommitGate();
// P0.5: reads are scoped by role before any UI can consume cached Cloud data.
installRoleScopedSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
