import { NextRequest } from "next/server";
import db from "@/lib/db";
import { generateSlug } from "@/lib/slug-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { resourceCategorySchema } from "@/lib/validators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const category = await db.resourceCategory.findUnique({ where: { slug: slug } });
        if (!category) return fail(404, "Resource category not found");
        return ok(category);
    } catch (error) {
        return serverError(error, "Failed to fetch resource category");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const parsed = await parseBody(request, resourceCategorySchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const newSlug = generateSlug(data.name);
        if (newSlug !== slug) {
            const clash = await db.resourceCategory.findUnique({ where: { slug: newSlug } });
            if (clash) return fail(409, "Resource category with this new name already exists");
        }

        const updated = await db.resourceCategory.update({
            where: { slug: slug },
            data: { name: data.name, slug: newSlug, description: data.description ?? null },
        });
        return ok(updated);
    } catch (error) {
        return serverError(error, "Failed to update resource category");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const associated = await db.resource.count({ where: { category: { slug: slug } } });
        if (associated > 0) return fail(409, "Cannot delete category with associated resources");

        await db.resourceCategory.delete({ where: { slug: slug } });
        return ok({ message: "Resource category deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete resource category");
    }
}
