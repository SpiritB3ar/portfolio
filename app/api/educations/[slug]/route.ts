import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withId } from "@/lib/mongo-util";
import { generateSlug } from "@/lib/slug-util";
import { ok, fail, serverError, parseBody } from "@/lib/api";
import { educationSchema } from "@/lib/validators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const education = await db.orm.Education.where({ slug: slug }).first();
        if (!education) return fail(404, "Education not found");
        return ok(withId(education));
    } catch (error) {
        return serverError(error, "Failed to fetch education");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const parsed = await parseBody(request, educationSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const newSlug = generateSlug(`${data.degree}-${data.institution}`);
        if (newSlug !== slug) {
            const clash = await db.orm.Education.where({ slug: newSlug }).first();
            if (clash) return fail(409, "Education with this degree and institution already exists");
        }

        const education = await db.orm.Education.where({ slug: slug }).update({
            institution: data.institution,
            degree: data.degree,
            field: data.field,
            slug: newSlug,
            startDate: data.startDate,
            endDate: data.endDate ?? null,
            order: data.order,
        });
        if (!education) return fail(404, "Education not found");
        return ok(withId(education));
    } catch (error) {
        return serverError(error, "Failed to update education");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const education = await db.orm.Education.where({ slug: slug }).first();
        if (!education) return fail(404, "Education not found");

        await db.orm.Education.where({ slug: slug }).delete();
        return ok({ message: "Education deleted successfully" });
    } catch (error) {
        return serverError(error, "Failed to delete education");
    }
}
