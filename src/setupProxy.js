const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 将所有 /api/* 请求代理到后端服务器 (18800 端口)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:18800',
      changeOrigin: true,
      secure: false,
      ws: true,
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err.message);
        res.status(500).json({ error: 'API proxy error' });
      },
      logLevel: 'debug'
    })
  );
};
