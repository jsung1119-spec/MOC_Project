import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";

const healthResponseSchema = z.object({
  ok: z.boolean(),
  database: z.string().optional(),
  connectedAt: z.string().optional(),
  error: z.string().optional(),
});

export async function GET() {
  try {
    await getDb().run(sql`SELECT 1`);
    const body = healthResponseSchema.parse({
      ok: true,
      database: "Cloudflare D1",
      connectedAt: new Date().toISOString(),
    });
    return NextResponse.json(body);
  } catch (error) {
    const body = healthResponseSchema.parse({
      ok: false,
      error: error instanceof Error ? error.message : "Database connection failed.",
    });
    return NextResponse.json(body, { status: 503 });
  }
}
