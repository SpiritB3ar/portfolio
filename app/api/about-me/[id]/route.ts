import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withId } from "@/lib/mongo-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { aboutSchema } from "@/lib/validators";

const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isObjectId(id)) return fail(400, "Invalid about paragraph id");
    try {
        const paragraph = await db.orm.AboutContent.where({ _id: id }).first();
        if (!paragraph) return fail(404, "About paragraph not found");
        return ok(withId(paragraph));
    } catch (error) {
        return serverError(error, "Failed to fetch about paragraph");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isObjectId(id)) return fail(400, "Invalid about paragraph id");
    try {
        const parsed = await parseBody(request, aboutSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const updated = await db.orm.AboutContent.where({ _id: id }).update({ paragraph: data.paragraph });
        if (!updated) return fail(404, "About paragraph not found");
        return ok(withId(updated));
    } catch (error) {
        return serverError(error, "Failed to update about paragraph");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isObjectId(id)) return fail(400, "Invalid about paragraph id");
    try {
        const paragraph = await db.orm.AboutContent.where({ _id: id }).first();
        if (!paragraph) return fail(404, "About paragraph not found");

        await db.orm.AboutContent.where({ _id: id }).delete();
        return ok({ message: "About paragraph deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete about paragraph");
    }
}
