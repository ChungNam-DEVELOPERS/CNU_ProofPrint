import "server-only";

import postgres, { type Sql } from "postgres";

const globalDatabase = globalThis as typeof globalThis & {
  cnuProofprintSql?: Sql;
};

function poolSize() {
  const parsed = Number.parseInt(process.env.DB_POOL_MAX ?? "5", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 20) : 5;
}

export function getDb(): Sql {
  if (globalDatabase.cnuProofprintSql) return globalDatabase.cnuProofprintSql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 환경 변수가 필요합니다.");
  }

  const sql = postgres(connectionString, {
    max: poolSize(),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: process.env.PGBOUNCER_TRANSACTION_MODE !== "true",
  });

  if (process.env.NODE_ENV !== "production") {
    globalDatabase.cnuProofprintSql = sql;
  }

  return sql;
}
