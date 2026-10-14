import { NextRequest } from "next/server";
import db from "@/lib/db";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { aboutSchema } from "@/lib/validators";

const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    if (!isObjectId(params.id)) return fail(400, "Invalid about paragraph id");
    try {
        const paragraph = await db.aboutContent.findUnique({ where: { id: params.id } });
        if (!paragraph) return fail(404, "About paragraph not found");
        return ok(paragraph);
    } catch (error) {
        return serverError(error, "Failed to fetch about paragraph");
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    if (!isObjectId(params.id)) return fail(400, "Invalid about paragraph id");
    try {
        const parsed = await parseBody(request, aboutSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const current = await db.aboutContent.findUnique({ where: { id: params.id } });
        if (!current) return fail(404, "About paragraph not found");

        const updated = await db.aboutContent.update({
            where: { id: params.id },
            data: { paragraph: data.paragraph },
        });
        return ok(updated);
    } catch (error) {
        return serverError(error, "Failed to update about paragraph");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    if (!isObjectId(params.id)) return fail(400, "Invalid about paragraph id");
    try {
        const paragraph = await db.aboutContent.findUnique({ where: { id: params.id } });
        if (!paragraph) return fail(404, "About paragraph not found");

        await db.aboutContent.delete({ where: { id: params.id } });
        return ok({ message: "About paragraph deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete about paragraph");
    }
}
