import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
  },
  build: {
    chunkSizeWarningLimit: 900, // Three.js + Drei is legitimately large for 3D features
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }

          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }

          // Three.js ecosystem - split to allow lazy loading of 3D features
          if (id.includes('node_modules/three')) {
            return 'three-core';
          }

          if (id.includes('node_modules/@react-three/fiber')) {
            return 'three-fiber';
          }

          if (id.includes('node_modules/@react-three/drei')) {
            return 'three-drei';
          }

          return undefined;
        },
      },
    },
  },
});
