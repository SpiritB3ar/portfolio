import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withId, withIds } from "@/lib/mongo-util";
import { generateSlug } from "@/lib/slug-util";
import { ok, created, fail, serverError, parseBody } from "@/lib/api";
import { skillCategorySchema } from "@/lib/validators";

const withOrderedSkills = <C extends { _id: string; skills: readonly { _id: string; order: number }[] }>(category: C) => ({
    ...withId(category),
    skills: withIds([...category.skills].sort((a, b) => a.order - b.order)),
});

export async function GET(request: NextRequest) {
    try {
        const categories = await db.orm.SkillCategory.include("skills").orderBy({ order: 1 }).all();
        return ok(categories.map(withOrderedSkills));
    } catch (error) {
        return serverError(error, "Failed to fetch skill categories");
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, skillCategorySchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const slug = generateSlug(data.name);
        const existing = await db.orm.SkillCategory.where({ slug }).first();
        if (existing) return fail(409, "Category with this name already exists");

        const newCategory = await db.orm.SkillCategory.create({
            name: data.name,
            slug,
            description: data.description ?? null,
            icon: data.icon ?? null,
            color: data.color ?? null,
            order: data.order ?? 0,
        });
        return created(withId(newCategory));
    } catch (error) {
        return serverError(error, "Failed to create skill category");
    }
}
