import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "@/lib/env";

import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __silowbpPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __silowbpDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function createPool() {
  return new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: 10,
    allowExitOnIdle: true,
    idleTimeoutMillis: 5_000,
  });
}

export const pool = globalThis.__silowbpPool ?? createPool();
export const db = globalThis.__silowbpDb ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis.__silowbpPool = pool;
  globalThis.__silowbpDb = db;
}

export { schema };
