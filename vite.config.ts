import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({command}) => ({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true
      }
    }
  }
}));

