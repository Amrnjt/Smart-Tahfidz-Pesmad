import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installCloudCommitGate } from './services/cloudCommitGate';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import './index.css';
import './design-foundation.css';

// P0.3: Firestore is the commit gate; LocalStorage remains cache only.
installCloudCommitGate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
