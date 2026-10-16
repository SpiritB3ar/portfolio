import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withId } from "@/lib/mongo-util";
import { generateSlug } from "@/lib/slug-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { skillSchema } from "@/lib/validators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const skill = await db.orm.Skill.include("category").where({ slug: slug }).first();
        if (!skill) return fail(404, "Skill not found");
        return ok({ ...withId(skill), category: skill.category ? withId(skill.category) : null });
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

        const category = await db.orm.SkillCategory.where({ _id: data.categoryId }).first();
        if (!category) return fail(404, "Category not found");

        const newSlug = generateSlug(data.name);
        if (newSlug !== slug) {
            const clash = await db.orm.Skill.where({ slug: newSlug }).first();
            if (clash) return fail(409, "Skill with this new name already exists");
        }

        const updated = await db.orm.Skill.where({ slug: slug }).update({
            name: data.name,
            slug: newSlug,
            categoryId: data.categoryId,
            proficiency: data.proficiency,
            order: data.order,
        });
        if (!updated) return fail(404, "Skill not found");
        const withCategory = await db.orm.Skill.include("category").where({ _id: updated._id }).first();
        if (!withCategory) return ok(withId(updated));
        return ok({
            ...withId(withCategory),
            category: withCategory.category ? withId(withCategory.category) : null,
        });
    } catch (error) {
        return serverError(error, "Failed to update skill");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const skill = await db.orm.Skill.where({ slug: slug }).first();
        if (!skill) return fail(404, "Skill not found");

        await db.orm.Skill.where({ slug: slug }).delete();
        return ok({ message: "Skill deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete skill");
    }
}
