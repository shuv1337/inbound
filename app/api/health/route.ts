import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function GET() {
	try {
		await db.execute(sql`SELECT 1`);
		return NextResponse.json({ status: "ok", db: "connected" }, { status: 200 });
	} catch {
		return NextResponse.json(
			{ status: "error", db: "disconnected" },
			{ status: 500 },
		);
	}
}
