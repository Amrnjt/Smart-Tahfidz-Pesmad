import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) return 'react-vendor';

            if (
              id.includes('/@firebase/firestore') ||
              id.includes('/firebase/firestore')
            ) return 'firestore-vendor';

            if (
              id.includes('/@firebase/') ||
              id.includes('/firebase/app')
            ) return 'firebase-core';

            if (
              id.includes('/recharts/') ||
              id.includes('/d3-')
            ) return 'charts-vendor';

            if (id.includes('/motion/')) return 'motion-vendor';
            if (id.includes('/lucide-react/')) return 'icons-vendor';

            return undefined;
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
