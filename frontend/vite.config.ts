import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'treat-js-as-jsx',
      async transform(code, id) {
        if (!/therapy-collab.*\.js$/.test(id)) return null;
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
    react(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:7001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:7001',
        changeOrigin: true,
      },
      '/cognitive': {
        target: 'http://localhost:7002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cognitive/, ''),
      },
      '/emotional': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/emotional/, ''),
      },
      '/emotion-ml': {
        target: 'http://localhost:7004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/emotion-ml/, ''),
      },
      '/therapy': {
        target: 'http://localhost:7006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/therapy/, ''),
      },
    }
  }
})

