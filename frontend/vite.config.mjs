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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split major libraries into separate chunks for faster loading and caching
            if (id.includes('@mui')) return 'vendor_mui';
            if (id.includes('apexcharts') || id.includes('recharts') || id.includes('chart.js') || id.includes('highcharts')) return 'vendor_charts';
            if (id.includes('lodash') || id.includes('moment') || id.includes('date-fns') || id.includes('dayjs')) return 'vendor_utils';
            if (id.includes('framer-motion') || id.includes('animate.css')) return 'vendor_animation';
            if (id.includes('xlsx') || id.includes('file-saver')) return 'vendor_data_export';
            if (id.includes('quill')) return 'vendor_editors';
            return 'vendor';
          }
        },
      },
    },
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
