import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

export function assertCronAuthorized(request: Request): NextResponse | null {
	if (!CRON_SECRET) {
		return null;
	}

	const authHeader = request.headers.get("authorization") || "";
	const expected = `Bearer ${CRON_SECRET}`;
	if (authHeader !== expected) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	return null;
}
