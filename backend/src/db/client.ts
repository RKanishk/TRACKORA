import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../config/env";
import * as schema from "./schema";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  // Idle client errors (e.g. dropped connection) shouldn't crash the
  // process — the pool recovers new connections automatically.
  console.error("Unexpected error on idle database client", err);
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
