import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const migrationDir = path.join(projectDir, "db", "migrations");
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres@127.0.0.1:55432/cnu_proofprint";
const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await sql`
    create table if not exists schema_migrations (
      version text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `;

  const files = (await readdir(migrationDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const migration = await readFile(path.join(migrationDir, file), "utf8");
    const checksum = createHash("sha256").update(migration).digest("hex");
    const [applied] = await sql`
      select checksum from schema_migrations where version = ${file}
    `;

    if (applied) {
      if (applied.checksum !== checksum) {
        throw new Error(`Applied migration changed: ${file}`);
      }
      continue;
    }

    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
      await tx`
        insert into schema_migrations (version, checksum)
        values (${file}, ${checksum})
      `;
    });
    console.log(`Applied ${file}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
