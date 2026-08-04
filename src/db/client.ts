import 'dotenv/config';
import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

export const databaseEnabled = Boolean(process.env.DATABASE_URL);

export const pool = databaseEnabled
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  : undefined;

if (pool && process.env.VERCEL) attachDatabasePool(pool);

export const database = pool ? drizzle(pool, { schema }) : undefined;
