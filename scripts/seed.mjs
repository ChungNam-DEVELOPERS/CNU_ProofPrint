import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const seedSql = await readFile(path.join(projectDir, "db", "seed.sql"), "utf8");
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres@127.0.0.1:55432/cnu_proofprint";
const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await sql.begin(async (tx) => {
    await tx.unsafe(seedSql);
  });
  console.log("Demo course, assignments, and workspaces are ready.");
} finally {
  await sql.end({ timeout: 5 });
}
