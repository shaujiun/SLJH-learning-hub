import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHistoryPreviewData } from './preview/historyPreviewData.js'

function historyPreviewPlugin() {
  return {
    name: 'history-preview-data',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__history-preview-data', (_request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify(createHistoryPreviewData()))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), historyPreviewPlugin()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 4174,
  },
})
