import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import SecureApp from './SecureApp.tsx';
import { installCloudCommitGate } from './services/cloudCommitGate';
import { installSecureAccountBridge } from './services/secureAccountBridge';
import { installRoleScopedSync } from './services/roleScopedSync';
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

// P0.3: generic Cloud commit semantics first.
installCloudCommitGate();
// P0.1: secure account lifecycle must override any legacy account methods.
installSecureAccountBridge();
// P0.5: role/ownership scoping wraps the authenticated lifecycle last.
installRoleScopedSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecureApp />
  </StrictMode>,
);
