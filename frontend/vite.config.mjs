import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

// ----------------------------------------------------------------------

export default defineConfig({
  plugins: [react(), jsconfigPaths()],

  optimizeDeps: {
    include: ['jwt-decode'],
    exclude: [
      'chunk-LFYLLGUC',
      'chunk-MRW7477U',
      'chunk-UAJHDIQT',
      'chunk-JAULPSYG',
      'chunk-JDJWOJYE',
      'chunk-Z2CPFR44',
      'chunk-S6LQLAKD',
      'chunk-WOCNRSER',
      'chunk-J4IQ5WAQ',
      'chunk-ZMWSBLPE',
      'chunk-PITYFMOH',
      'chunk-FETGDICG',
    ],
  },
  base: '/',
  define: {
    global: 'window',
  },

  build: {
    chunkSizeWarningLimit: 1000,
    // Disable sourcemaps to save memory during build
    sourcemap: false,
    // Reduce memory usage during minification
    minify: 'esbuild',
    target: 'es2020',
    // Optimize build performance
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Simplify chunking to reduce memory overhead
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group heavy UI libraries together
            if (id.includes('@mui') || id.includes('@nextui-org') || id.includes('@radix-ui')) {
              return 'vendor_ui';
            }
            // Group chart libraries
            if (id.includes('apexcharts') || id.includes('recharts') || id.includes('highcharts')) {
              return 'vendor_charts';
            }
            // Group data/export libraries (heaviest)
            if (id.includes('xlsx') || id.includes('quill') || id.includes('framer-motion')) {
              return 'vendor_heavy';
            }
            // Everything else
            return 'vendor';
          }
        },
      },
    },
    // Memory optimization for esbuild
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  esbuild: {
    // Drop console in production to reduce bundle size
    drop: ['console', 'debugger'],
    // Reduce memory usage
    treeShaking: true,
  },

  server: {
    open: false,
    host: true,
    port: 3000,
  },
  preview: {
    open: true,
    port: 3000,
  },
});
