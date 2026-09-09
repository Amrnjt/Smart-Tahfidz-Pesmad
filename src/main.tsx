import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installCloudCommitGate } from './services/cloudCommitGate';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import './index.css';
import './design-foundation.css';
import './app-shell.css';
import './dashboard-experience.css';
import './input-workflow.css';
import './history-experience.css';
import './motion-finish.css';
import './release-polish.css';
import './responsive-accessibility.css';
import './santri-experience-finish.css';
import './chrome-transition-fix.css';
import './ustadz-experience-finish.css';
import './setoran-workflow-finish.css';
import './setor-dropup.css';

// P0.3: Firestore is the commit gate; LocalStorage remains cache only.
installCloudCommitGate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
