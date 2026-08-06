import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPostgresConnection } from "@/db/postgres";

const healthResponseSchema = z.object({
  ok: z.boolean(),
  database: z.string().optional(),
  connectedAt: z.string().optional(),
  error: z.string().optional(),
});

export async function GET() {
  try {
    const connection = await verifyPostgresConnection();
    const body = healthResponseSchema.parse({
      ok: true,
      database: connection.database_name,
      connectedAt: connection.connected_at,
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
