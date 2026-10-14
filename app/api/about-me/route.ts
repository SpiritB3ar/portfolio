import { NextRequest } from "next/server";
import db from "@/lib/db";
import { ok, created, serverError, parseBody } from "@/lib/api";
import { aboutSchema } from "@/lib/validators";

export async function GET() {
    try {
        const aboutMe = await db.aboutContent.findMany({ orderBy: { createdAt: "asc" } });
        return ok(aboutMe);
    } catch (error) {
        return serverError(error, "Failed to fetch about content");
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, aboutSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const paragraph = await db.aboutContent.create({
            data: { paragraph: data.paragraph },
        });
        return created(paragraph);
    } catch (error) {
        return serverError(error, "Failed to create about paragraph");
    }
}
