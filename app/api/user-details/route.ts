import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withId } from "@/lib/mongo-util";
import { ok, created, fail, serverError, parseBody } from "@/lib/api";
import { userDetailSchema } from "@/lib/validators";

export async function GET() {
    try {
        // Singleton: returns the single UserDetail row, or null if none exists.
        // The frontend (`getHomeDataV2`) relies on receiving the object-or-null.
        const row = (await db.orm.UserDetail.all()).at(0) ?? null;
        return ok(row ? withId(row) : null);
    } catch (error) {
        return serverError(error, "Failed to fetch user detail");
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, userDetailSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const existing = (await db.orm.UserDetail.all()).at(0) ?? null;
        if (existing) return fail(400, "User detail already exists. Use PUT to update.");

        const userDetail = await db.orm.UserDetail.create({
            welcomeTitle: data.welcomeTitle,
            welcomeNote: data.welcomeNote,
            welcomeDescription: data.welcomeDescription,
            cvFile: data.cvFile ?? null,
            userImage: data.userImage,
        });
        return created(withId(userDetail));
    } catch (error) {
        return serverError(error, "Failed to create user detail");
    }
}

export async function PUT(request: NextRequest) {
    try {
        const parsed = await parseBody(request, userDetailSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        const existing = (await db.orm.UserDetail.all()).at(0) ?? null;
        if (!existing) return fail(404, "User detail not found. Create one first.");

        const userDetail = await db.orm.UserDetail.where({ _id: existing._id }).update({
            welcomeTitle: data.welcomeTitle,
            welcomeNote: data.welcomeNote,
            welcomeDescription: data.welcomeDescription,
            cvFile: data.cvFile ?? null,
            userImage: data.userImage,
        });
        if (!userDetail) return fail(404, "User detail not found. Create one first.");
        return ok(withId(userDetail));
    } catch (error) {
        return serverError(error, "Failed to update user detail");
    }
}
