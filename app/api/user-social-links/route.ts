import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withIds, withId } from "@/lib/mongo-util";
import { ok, created, fail, serverError, parseBody } from "@/lib/api";
import { socialLinkSchema } from "@/lib/validators";

export async function GET() {
    try {
        const links = await db.orm.UserSocialLinks.all();
        return ok(withIds(links));
    } catch (error) {
        return serverError(error, "Failed to fetch social links");
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, socialLinkSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const existing = await db.orm.UserSocialLinks.where({ name: data.name }).first();
        if (existing) return fail(409, "Social link with this name already exists");

        const link = await db.orm.UserSocialLinks.create({ name: data.name, link: data.link, icon: data.icon });
        return created(withId(link));
    } catch (error) {
        return serverError(error, "Failed to create social link");
    }
}
