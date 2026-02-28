import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '')
  const rawBasePath = env.VITE_BASE_PATH?.trim()
  if (!rawBasePath) {
    throw new Error(
      `Missing required VITE_BASE_PATH for mode "${mode}". Set it in your environment or .env.${mode}.`
    )
  }
  const normalizedBasePath = rawBasePath.startsWith('/')
    ? rawBasePath
    : `/${rawBasePath}`
  const basePath = normalizedBasePath.endsWith('/')
    ? normalizedBasePath
    : `${normalizedBasePath}/`
  
  return {
    plugins: [react(), tailwindcss()],
    base: basePath,
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for React and related libraries
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // Chart chunk for chart.js and related libraries
            charts: ['chart.js', 'react-chartjs-2'],
            // Query chunk for TanStack Query
            query: ['@tanstack/react-query'],
            // State management chunk
            state: ['zustand']
          }
        }
      },
      // Increase chunk size warning limit to 1MB for larger applications
      chunkSizeWarningLimit: 1000,
      // Enable minification and source maps for production
      minify: true,
      sourcemap: false // Disable source maps in production for smaller builds
    }
  }
})
