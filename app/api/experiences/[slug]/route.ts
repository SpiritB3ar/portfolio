import { NextRequest } from "next/server";
import db from "@/lib/db";
import { generateSlug } from "@/lib/slug-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { experienceSchema, toList } from "@/lib/validators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const experience = await db.experience.findUnique({ where: { slug: slug } });
        if (!experience) return fail(404, "Experience not found");
        return ok(experience);
    } catch (error) {
        return serverError(error, "Failed to fetch experience");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const parsed = await parseBody(request, experienceSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const newSlug = generateSlug(`${data.title}-${data.company}`);
        if (newSlug !== slug) {
            const clash = await db.experience.findUnique({ where: { slug: newSlug } });
            if (clash) return fail(409, "Experience with this new title and company already exists");
        }

        const updated = await db.experience.update({
            where: { slug: slug },
            data: {
                title: data.title,
                slug: newSlug,
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
        return ok(updated);
    } catch (error) {
        return serverError(error, "Failed to update experience");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const experience = await db.experience.findUnique({ where: { slug: slug } });
        if (!experience) return fail(404, "Experience not found");

        await db.experienceInput.deleteMany({ where: { experienceId: experience.id } });
        await db.experience.delete({ where: { slug: slug } });
        return ok({ message: "Experience deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete experience");
    }
}
