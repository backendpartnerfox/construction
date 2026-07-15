const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get target URL from environment variable or use default
  const targetUrl = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: function(proxyReq, req, res) {
        console.log('[Proxy]', req.method, req.path, '→', targetUrl + req.path);
      },
      onProxyRes: function(proxyRes, req, res) {
        console.log('[Proxy Response]', proxyRes.statusCode, req.path);
      },
      onError: function(err, req, res) {
        console.log('[Proxy Error]', err.message);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end(`Proxy error: ${err.message}\n\nMake sure backend server is running on ${targetUrl}`);
      }
    })
  );
};
