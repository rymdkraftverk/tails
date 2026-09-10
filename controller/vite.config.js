import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const inlined = [
  'REACT_APP_ERROR_LOGGING',
  'REACT_APP_VERSION',
  'REACT_APP_WS_ADDRESS',
]

export default defineConfig({
  plugins: [
    react({
      babel: { plugins: ['babel-plugin-styled-components'] },
    }),
  ],
  define: Object.fromEntries(
    inlined.map(key => [
      `process.env.${key}`,
      JSON.stringify(process.env[key] ?? null),
    ]),
  ),
  server: {
    port: 4001,
    strictPort: true,
    host: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
