import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema'; // Import all your schema exports


if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM instance
export const db = drizzle(pool, { schema, casing: 'snake_case' });

// --- Type Definition ---
// This is the crucial part for type safety!
// It infers the type of the 'db' object based on your schema.
export type DbType = typeof db;

//export const drizzlePlugin = new Elysia().decorate('db', db);