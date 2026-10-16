import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withId, withIds } from "@/lib/mongo-util";
import { generateSlug } from "@/lib/slug-util";
import { ok, created, fail, serverError, parseBody } from "@/lib/api";
import { skillSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
    try {
        const skills = await db.orm.Skill.include("category").orderBy({ order: 1 }).all();
        return ok(skills.map((s) => ({ ...withId(s), category: s.category ? withId(s.category) : null })));
    } catch (error) {
        return serverError(error, "Failed to fetch skills");
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, skillSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const category = await db.orm.SkillCategory.where({ _id: data.categoryId }).first();
        if (!category) return fail(404, "Category not found");

        const slug = generateSlug(data.name);
        const existing = await db.orm.Skill.where({ slug }).first();
        if (existing) return fail(409, "Skill with this name already exists");

        const createdSkill = await db.orm.Skill.create({
            name: data.name,
            slug,
            categoryId: data.categoryId,
                proficiency: data.proficiency,
                order: data.order ?? 0,
            });
        const newSkill = await db.orm.Skill.include("category").where({ _id: createdSkill._id }).first();
        if (!newSkill) return created(withId(createdSkill));
        return created({ ...withId(newSkill), category: newSkill.category ? withId(newSkill.category) : null });
    } catch (error) {
        return serverError(error, "Failed to create skill");
    }
}
