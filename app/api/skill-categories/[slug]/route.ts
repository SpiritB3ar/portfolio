import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withId, withIds } from "@/lib/mongo-util";
import { generateSlug } from "@/lib/slug-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { skillCategorySchema } from "@/lib/validators";

const withOrderedSkills = <C extends { _id: string; skills: readonly { _id: string; order: number }[] }>(category: C) => ({
    ...withId(category),
    skills: withIds([...category.skills].sort((a, b) => a.order - b.order)),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const category = await db.orm.SkillCategory.include("skills").where({ slug: slug }).first();
        if (!category) return fail(404, "Skill category not found");
        return ok(withOrderedSkills(category));
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
            const clash = await db.orm.SkillCategory.where({ slug: newSlug }).first();
            if (clash) return fail(409, "Category with this new name already exists");
        }

        const updated = await db.orm.SkillCategory.where({ slug: slug }).update({
            name: data.name,
            slug: newSlug,
            description: data.description ?? null,
            icon: data.icon ?? null,
            color: data.color ?? null,
            order: data.order,
        });
        if (!updated) return fail(404, "Skill category not found");
        return ok(withId(updated));
    } catch (error) {
        return serverError(error, "Failed to update skill category");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const category = await db.orm.SkillCategory.where({ slug: slug }).first();
        if (!category) return fail(404, "Category not found");
        const skills = await db.orm.Skill.where({ categoryId: category._id }).all();
        if (skills.length > 0) {
            return fail(409, "Cannot delete category with existing skills. Please delete or reassign the skills first.");
        }

        await db.orm.SkillCategory.where({ slug: slug }).delete();
        return ok({ message: "Skill category deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete skill category");
    }
}
