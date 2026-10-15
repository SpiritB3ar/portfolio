import { NextRequest } from "next/server";
import db from "@/lib/db";
import { generateSlug } from "@/lib/slug-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { resourceSchema, toList } from "@/lib/validators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const resource = await db.resource.findUnique({
            where: { slug: slug },
            include: { category: true },
        });
        if (!resource) return fail(404, "Resource not found");
        return ok(resource);
    } catch (error) {
        return serverError(error, "Failed to fetch resource");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const parsed = await parseBody(request, resourceSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const newSlug = generateSlug(data.title);
        if (newSlug !== slug) {
            const clash = await db.resource.findUnique({ where: { slug: newSlug } });
            if (clash) return fail(409, "Resource with this new title already exists");
        }

        const updated = await db.resource.update({
            where: { slug: slug },
            data: {
                title: data.title,
                slug: newSlug,
                description: data.description,
                content: data.content,
                coverImage: data.coverImage,
                link: data.link ?? null,
                type: data.type,
                categoryId: data.categoryId,
                tags: toList(data.tags),
                author: data.author,
                publishedAt: data.publishedAt,
                readTimeMinutes: data.readTimeMinutes ?? undefined,
            },
        });
        return ok(updated);
    } catch (error) {
        return serverError(error, "Failed to update resource");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        await db.resource.delete({ where: { slug: slug } });
        return ok({ message: "Resource deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete resource");
    }
}
