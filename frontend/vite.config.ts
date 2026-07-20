import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Vite rejects requests with an unrecognized Host header by default -
    // needed so the ngrok tunnel (used for real in-LINE-app LIFF testing,
    // since LIFF requires HTTPS) can reach this dev server. The free-tier
    // ngrok subdomain changes on every restart, so this allows any
    // *.ngrok-free.dev / *.ngrok.io host rather than one fixed value.
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io'],
    // The free ngrok plan only allows one tunnel, so the backend (port
    // 3000) isn't separately reachable from a phone opening the tunneled
    // frontend URL - proxying /api through this same dev server (paired
    // with a relative VITE_API_BASE_URL) lets one tunnel cover both.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
