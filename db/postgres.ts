import { neon } from "@neondatabase/serverless";

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured. Add it to .env before starting the app.");
  }
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
  }
  return url;
}

/**
 * Neon HTTP client. It is safe to use from the local Node runtime and the
 * Cloudflare Worker runtime used by this application.
 */
export function getPostgresClient() {
  return neon(databaseUrl());
}

export async function verifyPostgresConnection() {
  const sql = getPostgresClient();
  const rows = await sql`SELECT current_database() AS database_name, now() AS connected_at`;
  return rows[0] as { database_name: string; connected_at: string };
}
