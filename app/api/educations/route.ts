import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withIds, withId } from "@/lib/mongo-util";
import { generateSlug } from "@/lib/slug-util";
import { ok, created, fail, serverError, parseBody } from "@/lib/api";
import { educationSchema } from "@/lib/validators";

export async function GET() {
    try {
        const educations = await db.orm.Education.orderBy({ startDate: -1 }).all();
        return ok(withIds(educations));
    } catch (error) {
        return serverError(error, "Failed to fetch educations");
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, educationSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const slug = generateSlug(`${data.degree}-${data.institution}`);
        const existing = await db.orm.Education.where({ slug }).first();
        if (existing) return fail(409, "Education with this degree and institution already exists");

        const education = await db.orm.Education.create({
            institution: data.institution,
            degree: data.degree,
            field: data.field,
            slug,
            startDate: data.startDate,
            endDate: data.endDate ?? null,
            order: data.order ?? 0,
        });
        return created(withId(education));
    } catch (error) {
        return serverError(error, "Failed to create education");
    }
}
