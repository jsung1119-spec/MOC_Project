import { readdir, readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not configured.");

const sql = neon(url);
await sql.query(`
  CREATE TABLE IF NOT EXISTS app_migrations (
    id TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

const directory = new URL("../migrations/", import.meta.url);
const names = (await readdir(directory)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
for (const name of names) {
  const migrationId = name.replace(/\.sql$/, "");
  const applied = await sql`SELECT id FROM app_migrations WHERE id = ${migrationId}`;
  if (applied.length) { console.log(`SKIPPED ${migrationId} is already applied`); continue; }
  const source = await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8");
  const statements = source.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await sql.query(statement);
  await sql`INSERT INTO app_migrations (id) VALUES (${migrationId})`;
  console.log(`APPLIED ${migrationId} (${statements.length} statements)`);
}
