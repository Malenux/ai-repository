export default {
  base: '/',
  server: {
    port: 5177,
    proxy: {
      '/api': {
        target: 'http://chat-colectivo.com:8080',
        changeOrigin: true
      }
    }
  }
}
