import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = env.VITE_API_ORIGIN || 'http://localhost:8080';

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
  };
});
