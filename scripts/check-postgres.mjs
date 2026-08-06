import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not configured.");
const sql = neon(url);
const [result] = await sql`SELECT current_database() AS database_name, now() AS connected_at`;
const [migration] = await sql`SELECT id FROM app_migrations ORDER BY applied_at DESC LIMIT 1`;
const [{ table_count: tableCount }] = await sql`
  SELECT COUNT(*)::int AS table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('users', 'auth_sessions', 'moc_cases', 'moc_answers', 'moc_judgments', 'required_documents', 'reminders')
`;
console.log(`CONNECTED database=${result.database_name} at=${result.connected_at}`);
console.log(`MIGRATION latest=${migration?.id ?? "none"} verified_tables=${tableCount}`);
