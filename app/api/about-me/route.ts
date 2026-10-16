import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withIds, withId } from "@/lib/mongo-util";
import { ok, created, serverError, parseBody } from "@/lib/api";
import { aboutSchema } from "@/lib/validators";

export async function GET() {
    try {
        const aboutMe = await db.orm.AboutContent.orderBy({ createdAt: 1 }).all();
        return ok(withIds(aboutMe));
    } catch (error) {
        return serverError(error, "Failed to fetch about content");
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, aboutSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const paragraph = await db.orm.AboutContent.create({ paragraph: data.paragraph });
        return created(withId(paragraph));
    } catch (error) {
        return serverError(error, "Failed to create about paragraph");
    }
}
