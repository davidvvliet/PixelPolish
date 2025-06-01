import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // Allow external URLs to be accessed
    fs: {
      // Allow serving files from outside the project root
      strict: false,
      allow: ['..']
    },
    // Configure CORS headers
    cors: true,
    // Add proxy configuration for external URLs
    proxy: {
      // Proxy external URLs through /proxy/ endpoint
      '/proxy': {
        target: '',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Extract target URL from query parameter
            const url = new URL(req.url, `http://${req.headers.host}`);
            const targetUrl = url.searchParams.get('url');
            
            if (targetUrl) {
              // Rewrite the request to the target URL
              const target = new URL(targetUrl);
              proxyReq.setHeader('host', target.host);
              proxyReq.path = target.pathname + target.search;
            }
          });
        }
      }
    },
    // Set headers for iframe compatibility
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  },
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  // Preview server configuration (for built app)
  preview: {
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  }
}) 