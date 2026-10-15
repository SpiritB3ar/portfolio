import { NextRequest } from "next/server";
import db from "@/lib/db";
import { generateSlug } from "@/lib/slug-util";
import { ok, created, fail, serverError, parseBody } from "@/lib/api";
import { experienceSchema, toList } from "@/lib/validators";

export async function GET(request: NextRequest) {
    try {
        const experiences = await db.experience.findMany({ orderBy: { startDate: "desc" } });
        return ok(experiences);
    } catch (error) {
        return serverError(error, "Failed to fetch experiences");
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, experienceSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const slug = generateSlug(`${data.title}-${data.company}`);
        const existing = await db.experience.findUnique({ where: { slug } });
        if (existing) return fail(409, "Experience with this title and company already exists");

        const newExperience = await db.experience.create({
            data: {
                title: data.title,
                slug,
                company: data.company,
                description: data.description,
                location: data.location ?? null,
                image: data.image ?? null,
                clientImage: data.clientImage ?? null,
                startDate: data.startDate,
                endDate: data.endDate ?? null,
                technologies: toList(data.technologies),
            },
        });
        return created(newExperience);
    } catch (error) {
        return serverError(error, "Failed to create experience");
    }
}
