import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withId } from "@/lib/mongo-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { socialLinkSchema } from "@/lib/validators";

const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isObjectId(id)) return fail(400, "Invalid social link id");
    try {
        const link = await db.orm.UserSocialLinks.where({ _id: id }).first();
        if (!link) return fail(404, "Social link not found");
        return ok(withId(link));
    } catch (error) {
        return serverError(error, "Failed to fetch social link");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isObjectId(id)) return fail(400, "Invalid social link id");
    try {
        const parsed = await parseBody(request, socialLinkSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const current = await db.orm.UserSocialLinks.where({ _id: id }).first();
        if (!current) return fail(404, "Social link not found");

        if (data.name !== current.name) {
            const clash = await db.orm.UserSocialLinks.where({ name: data.name }).first();
            if (clash) return fail(409, "Social link with this new name already exists");
        }

        const updated = await db.orm.UserSocialLinks.where({ _id: id }).update({
            name: data.name,
            link: data.link,
            icon: data.icon,
        });
        if (!updated) return fail(404, "Social link not found");
        return ok(withId(updated));
    } catch (error) {
        return serverError(error, "Failed to update social link");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isObjectId(id)) return fail(400, "Invalid social link id");
    try {
        const link = await db.orm.UserSocialLinks.where({ _id: id }).first();
        if (!link) return fail(404, "Social link not found");

        await db.orm.UserSocialLinks.where({ _id: id }).delete();
        return ok({ message: "Social link deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete social link");
    }
}
