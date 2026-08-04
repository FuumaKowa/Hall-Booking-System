import type { Request, Response } from 'express';
import app from '../server';

export default function handler(req: Request, res: Response) {
  const forwardedPath = typeof req.query.__path === 'string' ? req.query.__path : '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === '__path') continue;
    if (Array.isArray(value)) value.forEach(item => query.append(key, String(item)));
    else if (value !== undefined) query.append(key, String(value));
  }
  req.url = `/api/${forwardedPath}${query.size ? `?${query.toString()}` : ''}`;
  return app(req, res);
}
