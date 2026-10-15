import { NextRequest } from "next/server";
import db from "@/lib/db";
import { generateSlug } from "@/lib/slug-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { projectSchema, toList } from "@/lib/validators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const project = await db.project.findUnique({
            where: { slug: slug },
            include: { tools: true },
        });
        if (!project) return fail(404, "Project not found");
        return ok(project);
    } catch (error) {
        return serverError(error, "Failed to fetch project");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const parsed = await parseBody(request, projectSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const newSlug = generateSlug(data.title);
        if (newSlug !== slug) {
            const clash = await db.project.findUnique({ where: { slug: newSlug } });
            if (clash) return fail(409, "Project with this new title already exists");
        }

        const updated = await db.project.update({
            where: { slug: slug },
            data: {
                title: data.title,
                slug: newSlug,
                description: data.description,
                content: data.content,
                coverImage: data.coverImage,
                cover: data.coverImage, // legacy mirror
                githubUrl: data.githubUrl ?? null,
                liveUrl: data.liveUrl ?? null,
                link: data.liveUrl ?? data.githubUrl ?? "", // legacy mirror
                about: data.description, // legacy mirror
                category: data.category,
                technologies: toList(data.technologies),
                publishedAt: data.publishedAt,
            },
        });
        return ok(updated);
    } catch (error) {
        return serverError(error, "Failed to update project");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const project = await db.project.findUnique({ where: { slug: slug } });
        if (!project) return fail(404, "Project not found");

        await db.project.delete({ where: { slug: slug } });
        return ok({ message: "Project deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete project");
    }
}
