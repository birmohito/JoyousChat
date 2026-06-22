import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool, type PoolConfig } from 'pg'
import * as schema from './schema'

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
}

// Supabase Postgres connections usually require SSL in hosted environments.
if (process.env.DATABASE_URL?.includes('supabase.co')) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  }
}

export const pool = new Pool(poolConfig)

export const db = drizzle(pool, { schema })
