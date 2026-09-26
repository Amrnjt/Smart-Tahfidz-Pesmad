import React from 'react';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Smart Tahfidz render recovery:', error, info);
    window.__PESMAD_APP_READY__?.();
  }

  private handleReload = () => {
    try {
      sessionStorage.removeItem('pesmad_pwa_recovery_v1');
    } catch {
      // Ignore storage restrictions in hardened webviews.
    }

    const url = new URL(window.location.href);
    url.searchParams.set('_app_refresh', String(Date.now()));
    window.location.replace(url.toString());
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10 flex items-center justify-center">
        <section
          className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl"
          role="alert"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
            ↻
          </div>
          <h1 className="text-lg font-extrabold text-slate-900">Aplikasi perlu dimuat ulang</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Smart Tahfidz gagal memuat salah satu bagian aplikasi. Ini biasanya terjadi setelah versi baru
            diterbitkan atau koneksi sempat terputus.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 min-h-11 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Muat Versi Terbaru
          </button>
        </section>
      </main>
    );
  }
}
