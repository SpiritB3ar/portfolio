import { NextRequest } from "next/server";
import db from "@/lib/db";
import { generateSlug } from "@/lib/slug-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { skillSchema } from "@/lib/validators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const skill = await db.skill.findUnique({
            where: { slug: slug },
            include: { category: true },
        });
        if (!skill) return fail(404, "Skill not found");
        return ok(skill);
    } catch (error) {
        return serverError(error, "Failed to fetch skill");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const parsed = await parseBody(request, skillSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const category = await db.skillCategory.findUnique({ where: { id: data.categoryId } });
        if (!category) return fail(404, "Category not found");

        const newSlug = generateSlug(data.name);
        if (newSlug !== slug) {
            const clash = await db.skill.findUnique({ where: { slug: newSlug } });
            if (clash) return fail(409, "Skill with this new name already exists");
        }

        const updated = await db.skill.update({
            where: { slug: slug },
            data: {
                name: data.name,
                slug: newSlug,
                categoryId: data.categoryId,
                proficiency: data.proficiency,
                order: data.order,
            },
            include: { category: true },
        });
        return ok(updated);
    } catch (error) {
        return serverError(error, "Failed to update skill");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        await db.skill.delete({ where: { slug: slug } });
        return ok({ message: "Skill deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete skill");
    }
}
