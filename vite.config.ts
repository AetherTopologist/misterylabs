import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function triadBuildId() {
  const fromEnv = process.env.VITE_TRIAD_BUILD || process.env.GITHUB_SHA;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

export default defineConfig({
  plugins: [react()],
  base: '/misterylabs/',
  define: {
    'import.meta.env.VITE_TRIAD_BUILD': JSON.stringify(triadBuildId()),
  },

  server: {
    host: '::',
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      '@tanstack/query-core',
    ],
  },

  build: {
    outDir: 'dist',
  },
});
