import type { IncomingMessage, ServerResponse } from 'node:http';
// Use the emitted .js extension for Node's strict ESM resolver. TypeScript and
// Vercel trace this back to the source file at ../server.ts during the build.
import app from '../server.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const requestUrl = new URL(req.url || '/', 'http://vercel.internal');
    const forwardedPath = requestUrl.searchParams.get('__path') || '';
    requestUrl.searchParams.delete('__path');
    const query = requestUrl.searchParams.toString();
    req.url = `/api/${forwardedPath}${query ? `?${query}` : ''}`;
    return app(req, res);
  } catch (error) {
    console.error('Vercel API adapter error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'API adapter failed to process the request.' }));
  }
}
