import { NextRequest } from "next/server";
import db from "@/lib/db";
import { ok, created, fail, serverError, parseBody } from "@/lib/api";
import { socialLinkSchema } from "@/lib/validators";

export async function GET() {
    try {
        const links = await db.userSocialLink.findMany();
        return ok(links);
    } catch (error) {
        return serverError(error, "Failed to fetch social links");
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, socialLinkSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const existing = await db.userSocialLink.findFirst({ where: { name: data.name } });
        if (existing) return fail(409, "Social link with this name already exists");

        const link = await db.userSocialLink.create({
            data: { name: data.name, link: data.link, icon: data.icon },
        });
        return created(link);
    } catch (error) {
        return serverError(error, "Failed to create social link");
    }
}
