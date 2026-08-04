const app = require('../dist/server.cjs').default;

module.exports = function handler(req, res) {
  try {
    const requestUrl = new URL(req.url || '/', 'http://vercel.internal');
    const forwardedPath = requestUrl.searchParams.get('__path') || '';
    requestUrl.searchParams.delete('__path');
    requestUrl.searchParams.delete('path');
    const query = requestUrl.searchParams.toString();
    req.url = `/api/${forwardedPath}${query ? `?${query}` : ''}`;
    return app(req, res);
  } catch (error) {
    console.error('Vercel API adapter error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'API adapter failed to process the request.' }));
  }
};
