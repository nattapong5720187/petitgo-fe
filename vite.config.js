import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Origin of the backend API, for the CSP `connect-src` in index.html.
 * Derived from VITE_API_BASE_URL so the two can never drift apart.
 * A relative base URL (e.g. `/api` via the dev proxy) is covered by 'self'.
 */
function apiOriginFrom(baseUrl) {
  if (!baseUrl || baseUrl.startsWith('/')) return ''
  try {
    return new URL(baseUrl).origin
  } catch {
    throw new Error(`VITE_API_BASE_URL is not a valid URL: ${baseUrl}`)
  }
}

function cspApiOrigin(apiOrigin) {
  return {
    name: 'csp-api-origin',
    transformIndexHtml: (html) => html.replaceAll('__API_ORIGIN__', apiOrigin),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.API_PROXY_TARGET || 'http://localhost:3000'
  const apiOrigin = apiOriginFrom(env.VITE_API_BASE_URL)

  return {
    plugins: [vue(), cspApiOrigin(apiOrigin)],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: proxyTarget.startsWith('https'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('if-none-match')
              proxyReq.removeHeader('if-modified-since')
            })
          },
        },
      },
    },
  }
})
