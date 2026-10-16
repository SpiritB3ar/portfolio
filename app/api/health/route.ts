import { NextResponse } from "next/server";
import db from "@/lib/db";

// Evaluated once per worker isolate — identifies which isolate served this request.
const ISOLATE_ID = Math.random().toString(36).slice(2);
const BOOTED_AT = Date.now();

/** Liveness probe: isolate identity + DB reachability (5s budget). No secrets. */
export async function GET() {
    let database = "skipped";
    try {
        const rows = await Promise.race([
            db.orm.UserSocialLinks.all(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("db-timeout-5s")), 5000)
            ),
        ]);
        database = `ok:${rows.length}`;
    } catch (error) {
        database = `fail:${error instanceof Error ? error.message.slice(0, 160) : String(error)}`;
    }
    return NextResponse.json({ isolate: ISOLATE_ID, bootedAt: BOOTED_AT, now: Date.now(), database });
}
