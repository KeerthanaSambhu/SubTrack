import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development, requests to /api are forwarded to the Express server,
// so the frontend and backend behave as if they share one origin.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'recharts-vendor': ['recharts'],
          'motion-vendor': ['motion/react'],
          'lucide-vendor': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
