import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";

/**
 * Shared API response helpers — the single, consistent contract for every
 * route under `app/api/**`.
 *
 * Success responses are returned raw (object/array). Error responses are always
 * `{ message }` with the correct status code — the raw `error`/exception is
 * NEVER sent to the client (only `console.error`'d server-side).
 */

/** 200 OK with a JSON body. */
export const ok = <T>(data: T) => NextResponse.json(data);

/** 201 Created with the created resource. */
export const created = <T>(data: T) => NextResponse.json(data, { status: 201 });

/** Any client error (400/404/409/...) with a safe `{ message }` body. */
export const fail = (status: number, message: string) =>
    NextResponse.json({ message }, { status });

/**
 * 500 helper: logs the real cause server-side and returns a generic
 * `{ message }` so internal/Prisma details never leak to the client.
 */
export const serverError = (error: unknown, message: string) => {
    console.error(message, error);
    return NextResponse.json({ message }, { status: 500 });
};

type ParseResult<T> = { data: T } | { response: NextResponse };

/**
 * Parse + validate a JSON request body against a Zod schema.
 *
 * Usage:
 *   const parsed = await parseBody(request, resourceSchema);
 *   if ("response" in parsed) return parsed.response; // 400 already formatted
 *   const { data } = parsed;
 */
export async function parseBody<T>(
    request: NextRequest,
    schema: ZodSchema<T>
): Promise<ParseResult<T>> {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return { response: fail(400, "Invalid JSON body") };
    }

    const result = schema.safeParse(body);
    if (!result.success) {
        const message = result.error.issues
            .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
            .join("; ");
        return { response: fail(400, message || "Invalid request body") };
    }

    return { data: result.data };
}
