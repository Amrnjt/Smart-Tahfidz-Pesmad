import React, { useEffect, useState } from 'react';
import App from './App';
import { authService } from './services/authService';
import { installSecureAccountBridge } from './services/secureAccountBridge';

installSecureAccountBridge();

export default function SecureApp() {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    authService.restoreSession()
      .catch((error) => {
        console.error('Secure app bootstrap failed:', error);
      })
      .finally(() => {
        if (active) setIsAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4" role="status" aria-live="polite">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
          Memverifikasi sesi aman…
        </div>
      </div>
    );
  }

  return <App />;
}
