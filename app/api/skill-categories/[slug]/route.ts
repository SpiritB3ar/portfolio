import { NextRequest } from "next/server";
import db from "@/lib/db";
import { generateSlug } from "@/lib/slug-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { skillCategorySchema } from "@/lib/validators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const category = await db.skillCategory.findUnique({
            where: { slug: slug },
            include: { skills: { orderBy: { order: "asc" } } },
        });
        if (!category) return fail(404, "Skill category not found");
        return ok(category);
    } catch (error) {
        return serverError(error, "Failed to fetch skill category");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const parsed = await parseBody(request, skillCategorySchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const newSlug = generateSlug(data.name);
        if (newSlug !== slug) {
            const clash = await db.skillCategory.findUnique({ where: { slug: newSlug } });
            if (clash) return fail(409, "Category with this new name already exists");
        }

        const updated = await db.skillCategory.update({
            where: { slug: slug },
            data: {
                name: data.name,
                slug: newSlug,
                description: data.description ?? null,
                icon: data.icon ?? null,
                color: data.color ?? null,
                order: data.order,
            },
        });
        return ok(updated);
    } catch (error) {
        return serverError(error, "Failed to update skill category");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const category = await db.skillCategory.findUnique({
            where: { slug: slug },
            include: { skills: true },
        });
        if (!category) return fail(404, "Category not found");
        if (category.skills.length > 0) {
            return fail(409, "Cannot delete category with existing skills. Please delete or reassign the skills first.");
        }

        await db.skillCategory.delete({ where: { slug: slug } });
        return ok({ message: "Skill category deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete skill category");
    }
}
